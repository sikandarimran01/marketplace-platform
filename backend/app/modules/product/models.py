from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    
    # Linked to the 'sellers' table from the seller module
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False)
    
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)

    # Store the Cloudinary image link (Media Layer - Step 4)
    image_url = Column(String, nullable=True)

    # Relationships
    # This allows you to easily find which store owns a product
    store = relationship("app.modules.seller.models.Seller", backref="items")
    
    # NEW: Link to the Reviews table
    reviews = relationship("Review", back_populates="product")

# --- NEW: REVIEW MODEL (Step 3: Ratings & Reviews) ---
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