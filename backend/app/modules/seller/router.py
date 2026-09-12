from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.modules.seller import models, schemas
from app.modules.product.models import Product
from app.modules.order.models import OrderItem  # For real sales calculation
from app.modules.wallet.models import Wallet    # For real wallet balance
from app.core.security import get_current_user
from app.modules.user.models import User

router = APIRouter(prefix="/sellers", tags=["Sellers"])

# --- 1. Create Store (Protected by Auth) ---
@router.post("/create-store", response_model=schemas.SellerResponse)
def create_store(
    store_data: schemas.SellerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_seller = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if existing_seller:
        raise HTTPException(status_code=400, detail="You already have a store registered.")
    
    name_taken = db.query(models.Seller).filter(models.Seller.store_name == store_data.store_name).first()
    if name_taken:
        raise HTTPException(status_code=400, detail="Store name already exists")
    
    new_store = models.Seller(
        user_id=current_user.id,
        store_name=store_data.store_name,
        is_active=True
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    
    # NEW: Initialize an empty wallet for the new seller
    new_wallet = Wallet(seller_id=new_store.id, balance=0.0)
    db.add(new_wallet)
    db.commit()
    
    return new_store

# --- 2. Dashboard Stats (Now with REAL Financial Data) ---
@router.get("/dashboard/stats")
def get_seller_stats(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    seller = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    
    if not seller:
        raise HTTPException(status_code=404, detail="Store not found for this user.")
    
    # A. Calculate REAL Total Sales from OrderItem table
    # This sums (price * quantity) for every item sold by this seller
    total_sales = db.query(func.sum(OrderItem.price * OrderItem.quantity))\
                    .filter(OrderItem.seller_id == seller.id).scalar() or 0.0
    
    # B. Get REAL Wallet Balance from Wallet table
    wallet = db.query(Wallet).filter(Wallet.seller_id == seller.id).first()
    current_balance = wallet.balance if wallet else 0.0
    
    # C. Count active products
    product_count = db.query(Product).filter(Product.seller_id == seller.id).count()

    # D. Count recent orders (distinct order_id)
    recent_orders_count = db.query(func.count(func.distinct(OrderItem.order_id)))\
                            .filter(OrderItem.seller_id == seller.id).scalar() or 0
    
    return {
        "store_name": seller.store_name,
        "total_sales": total_sales,
        "wallet_balance": current_balance,
        "total_products": product_count,
        "recent_orders": recent_orders_count
    }

# --- 3. Get My Store Info ---
@router.get("/my-store", response_model=schemas.SellerResponse)
def get_my_store(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    seller = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Store not found")
    return seller