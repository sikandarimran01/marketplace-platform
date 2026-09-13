from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import csv
import io
from pydantic import BaseModel

from app.core.database import get_db
from app.modules.product import models, schemas
from app.core.security import get_current_user
from app.modules.seller.models import Seller 
from app.modules.user.models import User

router = APIRouter(prefix="/products", tags=["Products & Inventory"])

# --- INVENTORY ADJUSTMENT SCHEMA ---
class StockAdjustmentRequest(BaseModel):
    product_id: int
    adjustment_type: str # 'add', 'subtract', or 'set'
    quantity: int
    reason: str
    warehouse: Optional[str] = "Main Hub - Bay A"

# --- 1. INVENTORY OVERVIEW METRICS ---
@router.get("/inventory/overview")
def get_inventory_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Store not found")

    products = db.query(models.Product).filter(models.Product.seller_id == seller.id).all()

    total_skus = len(products)
    total_units = sum(p.stock for p in products)
    total_valuation = sum(p.price * p.stock for p in products)
    low_stock = [p for p in products if 0 < p.stock <= (p.low_stock_threshold or 5)]
    out_of_stock = [p for p in products if p.stock == 0]
    in_stock = [p for p in products if p.stock > (p.low_stock_threshold or 5)]

    # Warehouse Breakdown
    warehouses_map = {}
    for p in products:
        wh = p.warehouse or "Main Hub - Bay A"
        if wh not in warehouses_map:
            warehouses_map[wh] = {"name": wh, "skus": 0, "units": 0}
        warehouses_map[wh]["skus"] += 1
        warehouses_map[wh]["units"] += p.stock

    return {
        "total_skus": total_skus,
        "total_units": total_units,
        "total_valuation": float(total_valuation),
        "in_stock_count": len(in_stock),
        "low_stock_count": len(low_stock),
        "out_of_stock_count": len(out_of_stock),
        "warehouses": list(warehouses_map.values()),
        "alerts": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock": p.stock,
                "threshold": p.low_stock_threshold or 5,
                "image_url": p.image_url,
                "status": "Out of Stock" if p.stock == 0 else "Low Stock"
            } for p in (out_of_stock + low_stock)
        ]
    }

# --- 2. STOCK ADJUSTMENT (Restock, Damage Write-off, Physical Correction) ---
@router.post("/inventory/adjust")
def adjust_stock(
    req: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    product = db.query(models.Product).filter(
        models.Product.id == req.product_id, 
        models.Product.seller_id == seller.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    prev_stock = product.stock

    if req.adjustment_type == "add":
        new_stock = prev_stock + req.quantity
        change = req.quantity
    elif req.adjustment_type == "subtract":
        new_stock = max(0, prev_stock - req.quantity)
        change = -(prev_stock - new_stock)
    else: # 'set'
        new_stock = max(0, req.quantity)
        change = new_stock - prev_stock

    product.stock = new_stock
    if req.warehouse:
        product.warehouse = req.warehouse

    # Create Audit Trail Log
    log = models.StockHistory(
        product_id=product.id,
        seller_id=seller.id,
        previous_stock=prev_stock,
        new_stock=new_stock,
        change_amount=change,
        reason=req.reason,
        warehouse=product.warehouse or "Main Hub - Bay A"
    )
    db.add(log)
    db.commit()

    return {
        "message": "Stock adjusted successfully",
        "previous_stock": prev_stock,
        "new_stock": new_stock,
        "product_name": product.name
    }

# --- 3. GET STOCK HISTORY AUDIT TRAIL ---
@router.get("/inventory/history")
def get_stock_history(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    query = db.query(models.StockHistory).filter(models.StockHistory.seller_id == seller.id)

    if product_id:
        query = query.filter(models.StockHistory.product_id == product_id)

    logs = query.order_by(models.StockHistory.created_at.desc()).limit(50).all()

    results = []
    for log in logs:
        p = db.query(models.Product).filter(models.Product.id == log.product_id).first()
        results.append({
            "id": log.id,
            "product_id": log.product_id,
            "product_name": p.name if p else "Deleted Item",
            "previous_stock": log.previous_stock,
            "new_stock": log.new_stock,
            "change_amount": log.change_amount,
            "reason": log.reason,
            "warehouse": log.warehouse,
            "date": log.created_at.strftime("%b %d, %Y %I:%M %p")
        })

    return results

# --- 4. Add Single Product ---
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
        image_url=product_in.image_url,
        status=product_in.status or "approved",
        category=product_in.category or "General",
        sku=product_in.sku,
        variants=product_in.variants
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    # Initial stock log
    if new_product.stock > 0:
        db.add(models.StockHistory(
            product_id=new_product.id,
            seller_id=seller.id,
            previous_stock=0,
            new_stock=new_product.stock,
            change_amount=new_product.stock,
            reason="Initial Product Creation",
            warehouse=new_product.warehouse or "Main Hub - Bay A"
        ))
        db.commit()

    return new_product

# --- 5. Bulk Upload Products via CSV File ---
@router.post("/bulk-upload")
async def bulk_upload_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Store required before uploading.")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV (.csv)")

    contents = await file.read()
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    created_count = 0
    for row in reader:
        try:
            p = models.Product(
                seller_id=seller.id,
                name=row.get("name", "Untitled Product"),
                description=row.get("description", ""),
                price=float(row.get("price", 0)),
                stock=int(row.get("stock", 0)),
                category=row.get("category", "General"),
                sku=row.get("sku", None),
                image_url=row.get("image_url", None),
                status=row.get("status", "approved")
            )
            db.add(p)
            created_count += 1
        except Exception:
            continue

    db.commit()
    return {"message": f"Successfully imported {created_count} products", "count": created_count}

# --- 6. Export Products to CSV File ---
@router.get("/export-csv")
def export_products_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Store not found")

    products = db.query(models.Product).filter(models.Product.seller_id == seller.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "category", "price", "stock", "sku", "status", "image_url", "warehouse"])

    for p in products:
        writer.writerow([p.id, p.name, p.category, p.price, p.stock, p.sku, p.status, p.image_url, p.warehouse])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=products_{seller.store_name}.csv"}
    )

# --- 7. List Public Marketplace Products (Approved only, with Search) ---
@router.get("/", response_model=List[schemas.ProductResponse])
def list_products(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Product).filter(models.Product.status == "approved")
    if q:
        query = query.filter(
            or_(
                models.Product.name.ilike(f"%{q}%"),
                models.Product.description.ilike(f"%{q}%")
            )
        )
    return query.all()

# --- 8. List Seller Products with Filter Tabs (Drafts, Low Stock, etc.) ---
@router.get("/my-products", response_model=List[schemas.ProductResponse])
def list_my_products(
    status_filter: Optional[str] = None,
    stock_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        return []

    query = db.query(models.Product).filter(models.Product.seller_id == seller.id)

    if status_filter and status_filter != "all":
        query = query.filter(models.Product.status == status_filter)

    if stock_filter == "out_of_stock":
        query = query.filter(models.Product.stock == 0)
    elif stock_filter == "low_stock":
        query = query.filter(models.Product.stock > 0, models.Product.stock <= 5)

    return query.order_by(models.Product.id.desc()).all()

# --- 9. Get Single Product (For Details Page) ---
@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product_details(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# --- 10. Edit / Update Product ---
@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.seller_id == seller.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or unauthorized")

    update_data = product_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)
    return product

# --- 11. Delete Product ---
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.seller_id == seller.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or unauthorized")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

# --- 12. Post a Review ---
@router.post("/{product_id}/reviews", response_model=schemas.ReviewResponse)
def add_review(
    product_id: int, 
    review_in: schemas.ReviewCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    
    new_review.user_name = current_user.full_name
    return new_review

# --- 13. Get Product Reviews ---
@router.get("/{product_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        r.user_name = user.full_name if user else "Anonymous"
    return reviews