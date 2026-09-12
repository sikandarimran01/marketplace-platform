from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_ 
from typing import List, Optional
from app.core.database import get_db
from app.modules.product import models, schemas
from app.core.security import get_current_user
from app.modules.seller.models import Seller 
from app.modules.user.models import User

router = APIRouter(prefix="/products", tags=["Products"])

# --- 1. Add Product (Protected) ---
@router.post("/add", response_model=schemas.ProductResponse)
def add_product(
    product_in: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    
    if not seller:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: You must create a store before adding products."
        )

    new_product = models.Product(
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
        stock=product_in.stock,
        seller_id=seller.id,
        image_url=product_in.image_url 
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# --- 2. List All Products (Public: with Search/Discovery) ---
@router.get("/", response_model=List[schemas.ProductResponse])
def list_products(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Product)
    if q:
        query = query.filter(
            or_(
                models.Product.name.ilike(f"%{q}%"),
                models.Product.description.ilike(f"%{q}%")
            )
        )
    return query.all()

# --- 3. List My Products (For the Seller Dashboard) ---
@router.get("/my-products", response_model=List[schemas.ProductResponse])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        return []
    return db.query(models.Product).filter(models.Product.seller_id == seller.id).all()

# --- 4. Get Single Product (For Product Details Page) ---
@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product_details(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# --- 5. Post a Review (Step 3: Ratings & Reviews - NEW) ---
@router.post("/{product_id}/reviews", response_model=schemas.ReviewResponse)
def add_review(
    product_id: int, 
    review_in: schemas.ReviewCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify product exists
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_review = models.Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    # Attach user name for the frontend response
    new_review.user_name = current_user.full_name
    return new_review

# --- 6. Get Product Reviews (Step 3: Ratings & Reviews - NEW) ---
@router.get("/{product_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    
    # Manually attach user names for the display
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        r.user_name = user.full_name if user else "Anonymous"
        
    return reviews