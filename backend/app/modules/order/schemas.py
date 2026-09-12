from pydantic import BaseModel
from typing import List

class OrderItemCreate(BaseModel):
    product_id: int
    seller_id: int
    price: float
    quantity: int

class OrderCreate(BaseModel):
    total_amount: float
    payment_method: str
    items: List[OrderItemCreate]