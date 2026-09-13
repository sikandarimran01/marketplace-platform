from fastapi import APIRouter, Depends, HTTPException, Body, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.modules.order import models, schemas
from app.modules.user.models import User
from app.modules.product.models import Product 
from app.modules.seller.models import Seller  
from app.modules.wallet.models import Wallet, Transaction 
from app.modules.wallet.service import calculate_commission 

# Background Tasks from Worker
from app.worker import notify_seller_new_order, alert_low_balance

router = APIRouter(prefix="/orders", tags=["Orders"])

# --- 1. PLACE ORDER (Buyer Flow - Bulletproof) ---
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

        notifications_to_send = []

        for item in order_in.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} not found")

            # Check stock
            if product.stock < item.quantity:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

            product.stock -= item.quantity

            order_item = models.OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                seller_id=product.seller_id,
                price=product.price,
                quantity=item.quantity,
                status="pending"
            )
            db.add(order_item)

            # Commission logic (10%)
            item_total = product.price * item.quantity
            commission, _ = calculate_commission(item_total)

            # Auto-create or fetch seller wallet (Failsafe)
            seller_wallet = db.query(Wallet).filter(Wallet.seller_id == product.seller_id).first()
            if not seller_wallet:
                seller_wallet = Wallet(seller_id=product.seller_id, balance=1000.0, pending_balance=0.0)
                db.add(seller_wallet)
                db.flush()

            # Verify balance
            if seller_wallet.balance < commission:
                db.rollback()
                raise HTTPException(
                    status_code=400, 
                    detail=f"Seller balance too low to cover platform fee on '{product.name}' (Required: Rs. {commission})"
                )

            # Deduct commission from seller's wallet
            seller_wallet.balance -= commission
            db.add(Transaction(
                wallet_id=seller_wallet.id,
                amount=-commission,
                type="commission_deduction",
                description=f"Platform Fee for Order #{new_order.id} - Item: {product.name}"
            ))

            # Prepare notification data
            seller_info = db.query(Seller).filter(Seller.id == product.seller_id).first()
            if seller_info:
                seller_user = db.query(User).filter(User.id == seller_info.user_id).first()
                if seller_user:
                    notifications_to_send.append({
                        "email": seller_user.email,
                        "order_id": new_order.id,
                        "amount": item_total,
                        "balance": seller_wallet.balance
                    })

        # Commit all database changes first
        db.commit()

        # Send background tasks safely AFTER commit
        for notif in notifications_to_send:
            try:
                notify_seller_new_order.delay(notif["email"], notif["order_id"], notif["amount"])
                alert_low_balance.delay(notif["email"], notif["balance"])
            except Exception as task_err:
                print(f"Background worker notification skipped: {task_err}")

        return {"message": "Order Created Successfully", "order_id": new_order.id}

    except Exception as e:
        db.rollback()
        print(f"ORDER ERROR DETAILS: {str(e)}")
        if isinstance(e, HTTPException): 
            raise e
        raise HTTPException(status_code=500, detail=f"Checkout error: {str(e)}")

# --- 2. GET SELLER ORDERS (Enriched with 12 Tabs & Customer Details) ---
@router.get("/seller/my-orders")
def get_seller_orders(
    status_filter: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetches all items sold by the logged-in seller with full details"""
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller: 
        raise HTTPException(status_code=404, detail="Seller profile not found")

    query = db.query(models.OrderItem).filter(models.OrderItem.seller_id == seller.id)

    # 12 Filter Tabs mapping
    if status_filter and status_filter != "all":
        if status_filter == "new":
            query = query.filter(models.OrderItem.status == "pending")
        elif status_filter == "returned":
            query = query.filter(models.OrderItem.status.in_(["returned", "return_requested"]))
        else:
            query = query.filter(models.OrderItem.status == status_filter)

    items = query.order_by(models.OrderItem.id.desc()).all()

    # Enrich response with Customer and Product details
    results = []
    for item in items:
        order = db.query(models.Order).filter(models.Order.id == item.order_id).first()
        product = db.query(Product).filter(Product.id == item.product_id).first()
        buyer = db.query(User).filter(User.id == order.user_id).first() if order else None

        # Search filter by product name, order id, or buyer email
        if q:
            match_name = product and q.lower() in product.name.lower()
            match_id = str(item.order_id) == q or str(item.id) == q
            match_buyer = buyer and q.lower() in buyer.email.lower()
            if not (match_name or match_id or match_buyer):
                continue

        results.append({
            "id": item.id,
            "order_id": item.order_id,
            "product_id": item.product_id,
            "product_name": product.name if product else "Product",
            "product_image": product.image_url if product else None,
            "price": item.price,
            "quantity": item.quantity,
            "status": item.status,
            "payment_method": order.payment_method if order else "COD",
            "order_date": order.created_at.strftime("%b %d, %Y %I:%M %p") if order and order.created_at else "Recent",
            "customer_name": buyer.full_name if buyer and buyer.full_name else "Customer",
            "customer_email": buyer.email if buyer else ""
        })

    return results

# --- 3. EXPORT SELLER ORDERS TO CSV ---
@router.get("/seller/export-csv")
def export_seller_orders_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Store not found")

    items = db.query(models.OrderItem).filter(models.OrderItem.seller_id == seller.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["item_id", "order_id", "product_name", "price", "quantity", "total", "status", "payment_method", "order_date", "customer_email"])

    for item in items:
        order = db.query(models.Order).filter(models.Order.id == item.order_id).first()
        product = db.query(Product).filter(Product.id == item.product_id).first()
        buyer = db.query(User).filter(User.id == order.user_id).first() if order else None
        
        writer.writerow([
            item.id,
            item.order_id,
            product.name if product else "Item",
            item.price,
            item.quantity,
            item.price * item.quantity,
            item.status,
            order.payment_method if order else "COD",
            order.created_at if order else "",
            buyer.email if buyer else ""
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=orders_{seller.store_name}.csv"}
    )

# --- 4. UPDATE ORDER ITEM STATUS (Full Lifecycle + Cancellation Restores Stock & Fee) ---
@router.patch("/item/{item_id}/status")
def update_order_item_status(
    item_id: int,
    new_status: str = Body(..., embed=True), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    if not item: 
        raise HTTPException(status_code=404, detail="Order item not found")
        
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller or item.seller_id != seller.id: 
        raise HTTPException(status_code=403, detail="Not authorized to manage this order")

    # If order is cancelled, restore inventory and refund seller's fee
    if new_status == "cancelled" and item.status != "cancelled":
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity # Restore stock

        item_total = item.price * item.quantity
        commission, _ = calculate_commission(item_total)
        seller_wallet = db.query(Wallet).filter(Wallet.seller_id == seller.id).first()
        if seller_wallet:
            seller_wallet.balance += commission
            db.add(Transaction(
                wallet_id=seller_wallet.id,
                amount=commission,
                type="refund_reversal",
                description=f"Fee Returned for Cancelled Order #{item.order_id}"
            ))

    item.status = new_status
    db.commit()
    return {"message": f"Order status updated to '{new_status}'", "new_status": item.status}

# --- 5. GET MY PURCHASES ---
@router.get("/my-purchases")
def get_buyer_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    results = []
    for order in orders:
        items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).all()
        results.append({
            "order_id": order.id, 
            "total": order.total_amount, 
            "status": order.status, 
            "date": order.created_at, 
            "items": items
        })
    return results

# --- 6. REQUEST RETURN (Buyer Flow) ---
@router.post("/item/{item_id}/request-return")
def request_return(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    item = db.query(models.OrderItem).join(models.Order).filter(
        models.OrderItem.id == item_id, 
        models.Order.user_id == current_user.id
    ).first()
    
    if not item: 
        raise HTTPException(status_code=404, detail="Item not found")
    if item.status not in ["delivered", "return_period"]: 
        raise HTTPException(status_code=400, detail="Only delivered items can be returned")

    item.status = "return_requested"
    db.commit()
    return {"message": "Return request submitted to Admin."}

# --- 7. APPROVE REFUND (Admin Flow) ---
@router.post("/item/{item_id}/approve-refund")
def approve_refund(
    item_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    if not item or item.status != "return_requested":
        raise HTTPException(status_code=400, detail="No active return request found")

    # Restore Product Stock
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if product: 
        product.stock += item.quantity

    # Refund commission back to Seller Wallet
    item_total = item.price * item.quantity
    commission, _ = calculate_commission(item_total)
    
    seller_wallet = db.query(Wallet).filter(Wallet.seller_id == item.seller_id).first()
    if seller_wallet:
        seller_wallet.balance += commission
        db.add(Transaction(
            wallet_id=seller_wallet.id,
            amount=commission,
            type="refund_reversal",
            description=f"Fee Refunded for Item #{item.id} (Return Approved)"
        ))

    item.status = "refunded"
    db.commit()
    return {"message": "Refund processed. Stock restored and commission returned."}