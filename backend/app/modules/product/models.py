from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    
    # Linked to the 'sellers' table from the seller module
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False)
    
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)

    # Store the Cloudinary image link (Media Layer)
    image_url = Column(String, nullable=True)

    # Product Lifecycle & Variants
    # Statuses: 'approved' (live in store), 'pending' (under review), 'draft', 'rejected'
    status = Column(String, default="approved", index=True)
    category = Column(String, default="General", nullable=True)
    sku = Column(String, nullable=True)
    # Stored as JSON string e.g. [{"name": "Size: L", "price": 2500, "stock": 10}]
    variants = Column(Text, nullable=True) 
    rejection_reason = Column(String, nullable=True)
    
    # --- NEW FIELDS FOR 4. INVENTORY CONTROL ---
    warehouse = Column(String, default="Main Hub - Bay A", nullable=True)
    low_stock_threshold = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # This allows you to easily find which store owns a product
    store = relationship("app.modules.seller.models.Seller", backref="items")
    
    # Link to the Reviews table
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    
    # NEW: Link to the Stock History Audit Trail
    stock_logs = relationship("StockHistory", back_populates="product", cascade="all, delete-orphan")

# --- STOCK HISTORY / INVENTORY LEDGER MODEL (New for 4. Inventory) ---
class StockHistory(Base):
    __tablename__ = "stock_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False)
    previous_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    change_amount = Column(Integer, nullable=False) # e.g. +20 or -5
    reason = Column(String, nullable=False) # e.g. "Restock Delivery", "Damaged / Expired", "Physical Count Correction"
    warehouse = Column(String, default="Main Hub - Bay A")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="stock_logs")

# --- REVIEW MODEL (Ratings & Reviews) ---
class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, nullable=False) # 1 to 5 Stars
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="reviews")
    # Link back to the user who wrote the review
    user = relationship("app.modules.user.models.User")