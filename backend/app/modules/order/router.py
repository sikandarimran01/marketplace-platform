from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin # UPDATED: Added Admin check
from app.modules.order import models, schemas
from app.modules.user.models import User
from app.modules.product.models import Product 
from app.modules.seller.models import Seller  
from app.modules.wallet.models import Wallet, Transaction 
from app.modules.wallet.service import calculate_commission 

# Background Tasks from Worker
from app.worker import notify_seller_new_order, alert_low_balance

router = APIRouter(prefix="/orders", tags=["Orders"])

# --- 1. PLACE ORDER (Buyer Flow) ---
@router.post("/create")
def create_order(
    order_in: schemas.OrderCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_order = models.Order(
            user_id=current_user.id,
            total_amount=order_in.total_amount,
            payment_method=order_in.payment_method,
            status="pending" 
        )
        db.add(new_order)
        db.flush() 

        notified_sellers = set()

        for item in order_in.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} not found")

            order_item = models.OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                seller_id=product.seller_id,
                price=product.price,
                quantity=item.quantity,
                status="pending"
            )
            db.add(order_item)
            
            if product.stock >= item.quantity:
                product.stock -= item.quantity
            else:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

            # Pre-paid Commission Logic
            item_total = product.price * item.quantity
            commission, _ = calculate_commission(item_total)

            seller_wallet = db.query(Wallet).filter(Wallet.seller_id == product.seller_id).first()
            if not seller_wallet or seller_wallet.balance < commission:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Seller balance too low for commission on '{product.name}'")

            seller_wallet.balance -= commission
            db.add(Transaction(
                wallet_id=seller_wallet.id,
                amount=-commission,
                type="commission_deduction",
                description=f"Platform Fee for Order #{new_order.id} - Item: {product.name}"
            ))

            if product.seller_id not in notified_sellers:
                seller_info = db.query(Seller).filter(Seller.id == product.seller_id).first()
                seller_user = db.query(User).filter(User.id == seller_info.user_id).first()
                
                # Trigger Worker Tasks
                notify_seller_new_order.delay(seller_user.email, new_order.id, item_total)
                alert_low_balance.delay(seller_user.email, seller_wallet.balance)
                notified_sellers.add(product.seller_id)
        
        db.commit()
        return {"message": "Order Created Successfully", "order_id": new_order.id}

    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Checkout failed")

# --- 2. GET SELLER ORDERS ---
@router.get("/seller/my-orders")
def get_seller_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller: raise HTTPException(status_code=404, detail="Seller profile not found")
    return db.query(models.OrderItem).filter(models.OrderItem.seller_id == seller.id).all()

# --- 3. UPDATE ORDER ITEM STATUS ---
@router.patch("/item/{item_id}/status")
def update_order_item_status(
    item_id: int,
    new_status: str = Body(..., embed=True), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    if not item: raise HTTPException(status_code=404, detail="Order item not found")
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller or item.seller_id != seller.id: raise HTTPException(status_code=403, detail="Not authorized")
    item.status = new_status
    db.commit()
    return {"message": "Status updated", "new_status": item.status}

# --- 4. GET MY PURCHASES ---
@router.get("/my-purchases")
def get_buyer_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    results = []
    for order in orders:
        items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
        results.append({"order_id": order.id, "total": order.total_amount, "status": order.status, "date": order.created_at, "items": items})
    return results

# --- 5. REQUEST RETURN (Buyer Flow - NEW) ---
@router.post("/item/{item_id}/request-return")
def request_return(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Allows a buyer to flag a delivered item for return"""
    item = db.query(models.OrderItem).join(models.Order).filter(
        models.OrderItem.id == item_id, 
        models.Order.user_id == current_user.id
    ).first()
    
    if not item: raise HTTPException(status_code=404, detail="Item not found")
    if item.status != "delivered": raise HTTPException(status_code=400, detail="Only delivered items can be returned")

    item.status = "return_requested"
    db.commit()
    return {"message": "Return request submitted to Admin."}

# --- 6. APPROVE REFUND (Admin Flow - NEW) ---
@router.post("/item/{item_id}/approve-refund")
def approve_refund(
    item_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin) # Secure Admin endpoint
):
    """Admin approves refund: restores stock and returns commission to seller wallet"""
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    if not item or item.status != "return_requested":
        raise HTTPException(status_code=400, detail="No active return request found")

    # A. Restore Product Stock
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if product: product.stock += item.quantity

    # B. Calculate commission to refund to Seller's pre-paid balance
    item_total = item.price * item.quantity
    commission, _ = calculate_commission(item_total)
    
    seller_wallet = db.query(Wallet).filter(Wallet.seller_id == item.seller_id).first()
    if seller_wallet:
        seller_wallet.balance += commission # Refund the fee
        # C. Record reversal in Ledger
        db.add(Transaction(
            wallet_id=seller_wallet.id,
            amount=commission,
            type="refund_reversal",
            description=f"Fee Refunded for Item #{item.id} (Return Approved)"
        ))

    # D. Finalize status
    item.status = "refunded"
    db.commit()
    return {"message": "Refund processed. Stock restored and commission returned."}