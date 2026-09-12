from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"), unique=True)
    balance = Column(Float, default=0.0) # Real available money
    pending_balance = Column(Float, default=0.0) # Money from orders not yet completed
    updated_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    amount = Column(Float)
    type = Column(String) # 'earning', 'withdrawal', 'commission_deduction'
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)