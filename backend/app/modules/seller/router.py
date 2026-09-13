from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, time, timedelta
from typing import List

from app.core.database import get_db
from app.modules.seller import models, schemas
from app.modules.product.models import Product
from app.modules.order.models import Order, OrderItem
from app.modules.wallet.models import Wallet, Transaction
from app.core.security import get_current_user
from app.modules.user.models import User

router = APIRouter(prefix="/sellers", tags=["Sellers"])

# --- 1. Create Store ---
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
    
    # Initialize wallet for seller
    new_wallet = Wallet(seller_id=new_store.id, balance=0.0, pending_balance=0.0)
    db.add(new_wallet)
    db.commit()
    
    return new_store

# --- 2. Comprehensive Dashboard Analytics (100% Functional) ---
@router.get("/dashboard/stats")
def get_seller_stats(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    seller = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Store not found for this user.")

    # A. TODAY'S SALES
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_sales = db.query(func.sum(OrderItem.price * OrderItem.quantity))\
                    .join(Order, Order.id == OrderItem.order_id)\
                    .filter(OrderItem.seller_id == seller.id, Order.created_at >= today_start).scalar() or 0.0

    # B. TOTAL SALES (All-time gross revenue)
    total_sales = db.query(func.sum(OrderItem.price * OrderItem.quantity))\
                    .filter(OrderItem.seller_id == seller.id).scalar() or 0.0

    # C. TOTAL ORDERS
    total_orders = db.query(func.count(func.distinct(OrderItem.order_id)))\
                     .filter(OrderItem.seller_id == seller.id).scalar() or 0

    # D. PENDING ORDERS (Pending or Shipped)
    pending_orders = db.query(func.count(func.distinct(OrderItem.order_id)))\
                       .filter(OrderItem.seller_id == seller.id, OrderItem.status.in_(["pending", "shipped"])).scalar() or 0

    # E. DELIVERED ORDERS
    delivered_orders = db.query(func.count(func.distinct(OrderItem.order_id)))\
                         .filter(OrderItem.seller_id == seller.id, OrderItem.status == "delivered").scalar() or 0

    # F. PRODUCTS COUNT
    total_products = db.query(Product).filter(Product.seller_id == seller.id).count()

    # G. CUSTOMERS (Distinct buyers who purchased from this seller)
    total_customers = db.query(func.count(func.distinct(Order.user_id)))\
                        .join(OrderItem, OrderItem.order_id == Order.id)\
                        .filter(OrderItem.seller_id == seller.id).scalar() or 0

    # H. WALLET BALANCE & PENDING COMMISSION
    wallet = db.query(Wallet).filter(Wallet.seller_id == seller.id).first()
    wallet_balance = wallet.balance if wallet else 0.0
    pending_commission = wallet.pending_balance if wallet else 0.0

    # I. TOTAL COMMISSION PAID (All-time platform deductions)
    total_commission_paid = 0.0
    if wallet:
        total_commission_paid = db.query(func.sum(func.abs(Transaction.amount)))\
                                  .filter(Transaction.wallet_id == wallet.id, Transaction.type == "commission_deduction").scalar() or 0.0

    # J. SALES CHART (Daily revenue for the last 7 days)
    sales_chart = []
    for i in range(6, -1, -1):
        day_date = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day_date, time.min)
        day_end = datetime.combine(day_date, time.max)
        day_total = db.query(func.sum(OrderItem.price * OrderItem.quantity))\
                      .join(Order, Order.id == OrderItem.order_id)\
                      .filter(OrderItem.seller_id == seller.id, Order.created_at >= day_start, Order.created_at <= day_end).scalar() or 0.0
        sales_chart.append({
            "date": day_date.strftime("%b %d"),
            "day": day_date.strftime("%a"),
            "amount": float(day_total)
        })

    return {
        "store_name": seller.store_name,
        "today_sales": float(today_sales),
        "total_sales": float(total_sales),
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "delivered_orders": delivered_orders,
        "total_products": total_products,
        "total_customers": total_customers,
        "wallet_balance": float(wallet_balance),
        "pending_commission": float(pending_commission),
        "total_commission_paid": float(total_commission_paid),
        "sales_chart": sales_chart
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