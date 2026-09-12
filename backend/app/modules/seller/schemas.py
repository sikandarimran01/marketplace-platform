from pydantic import BaseModel

class SellerBase(BaseModel):
    store_name: str

class SellerCreate(SellerBase):
    pass

class SellerResponse(SellerBase):
    id: int
    user_id: int
    is_active: bool

    class Config:
        from_attributes = True