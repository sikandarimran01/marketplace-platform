from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float, nullable=False)
    # Global order status: pending, completed, cancelled
    status = Column(String, default="pending") 
    payment_method = Column(String) # COD, EasyPaisa, Card
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    seller_id = Column(Integer, ForeignKey("sellers.id")) 
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    
    # NEW: Tracking individual item lifecycle (Steps 3-4 in your diagram)
    # Statuses: pending, shipped, delivered, cancelled
    status = Column(String, default="pending") 

    order = relationship("Order", back_populates="items")