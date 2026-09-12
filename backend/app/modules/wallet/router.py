from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.wallet import models
from app.modules.seller.models import Seller
from app.modules.user.models import User

router = APIRouter(prefix="/wallet", tags=["Wallet"])

# --- 1. GET WALLET DETAILS (Existing logic preserved) ---
@router.get("/my-wallet")
def get_wallet_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches current balance and the last 10 transactions for the ledger"""
    # 1. Find the seller
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    # 2. Get the wallet
    wallet = db.query(models.Wallet).filter(models.Wallet.seller_id == seller.id).first()
    if not wallet:
        # Create one if missing (failsafe for new sellers)
        wallet = models.Wallet(seller_id=seller.id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    # 3. Get recent transactions (Ledger)
    transactions = db.query(models.Transaction).filter(
        models.Transaction.wallet_id == wallet.id
    ).order_by(models.Transaction.created_at.desc()).limit(10).all()

    return {
        "balance": wallet.balance,
        "pending_balance": wallet.pending_balance,
        "transactions": transactions
    }

# --- 2. TOP-UP WALLET (NEW: EasyPaisa Simulation) ---
@router.post("/top-up")
def top_up_wallet(
    amount: float = Body(..., embed=True), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Simulates adding money to the platform wallet via EasyPaisa.
    This balance is used to pay for platform commissions on COD orders.
    """
    # 1. Identify Seller
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    # 2. Identify/Create Wallet
    wallet = db.query(models.Wallet).filter(models.Wallet.seller_id == seller.id).first()
    if not wallet:
        wallet = models.Wallet(seller_id=seller.id, balance=0.0)
        db.add(wallet)
        db.flush()

    # 3. Update numerical balance
    wallet.balance += amount
    
    # 4. Record the Deposit in the Ledger
    new_transaction = models.Transaction(
        wallet_id=wallet.id,
        amount=amount,
        type="deposit", # 'deposit' identifies money added by seller
        description=f"Wallet Top-up via EasyPaisa (Simulation)"
    )
    db.add(new_transaction)
    
    db.commit()
    
    return {
        "message": "Deposit successful", 
        "added_amount": amount, 
        "new_balance": wallet.balance
    }