from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_admin
from app.modules.user.models import User
from app.modules.seller.models import Seller
from app.modules.product.models import Product
from app.modules.wallet.models import Transaction
# NEW: Import OrderItem to handle refund queue
from app.modules.order.models import OrderItem 

router = APIRouter(prefix="/admin", tags=["Admin Control Panel"])

@router.get("/stats")
def get_platform_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Global Stats for the Admin Dashboard"""
    
    total_users = db.query(User).count()
    total_sellers = db.query(Seller).count()
    total_products = db.query(Product).count()
    
    # Calculate Platform Revenue (Sum of all negative transactions which are commissions)
    platform_earnings = db.query(func.sum(Transaction.amount))\
                          .filter(Transaction.type == "commission_deduction").scalar() or 0.0

    return {
        "users_count": total_users,
        "sellers_count": total_sellers,
        "products_count": total_products,
        "platform_revenue": abs(platform_earnings)
    }

@router.get("/users")
def list_all_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Fetch all registered user accounts for the system directory"""
    return db.query(User).all()

# --- NEW: REFUND QUEUE ENDPOINT (Step 5: Returns & Refunds) ---
@router.get("/refund-requests")
def get_refund_requests(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """
    Fetches all individual order items where a buyer has 
    submitted a request for a return/refund.
    """
    requests = db.query(OrderItem).filter(OrderItem.status == "return_requested").all()
    return requests