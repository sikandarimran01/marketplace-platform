from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- PRODUCT SCHEMAS (Preserving Previous Data) ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    # Preserving the Cloudinary image link from Step 4
    image_url: Optional[str] = None 

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    seller_id: int

    class Config:
        from_attributes = True

# --- NEW: REVIEW SCHEMAS (Step 3: Ratings & Reviews) ---
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
    # We will manually populate the user's name in the router for the UI
    user_name: Optional[str] = None 

    class Config:
        from_attributes = True