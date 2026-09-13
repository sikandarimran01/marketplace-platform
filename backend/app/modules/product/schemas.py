from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    image_url: Optional[str] = None 
    # NEW FIELDS FOR PRODUCT LIFECYCLE & VARIANTS
    status: Optional[str] = "approved" # approved, pending, draft, rejected
    category: Optional[str] = "General"
    sku: Optional[str] = None
    variants: Optional[str] = None # Stored as JSON string list of variants

class ProductCreate(ProductBase):
    pass

# NEW: For editing existing products
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    variants: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    seller_id: int
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- REVIEW SCHEMAS (Preserving Previous Data) ---
class ReviewBase(BaseModel):
    # Field validation: rating must be between 1 and 5 stars
    rating: int = Field(..., ge=1, le=5) 
    comment: str

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    created_at: datetime
    user_name: Optional[str] = None 

    class Config:
        from_attributes = True