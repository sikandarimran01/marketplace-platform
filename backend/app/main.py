from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.user.router import router as user_router
from app.modules.seller.router import router as seller_router
from app.modules.product.router import router as product_router
from app.modules.order.router import router as order_router 
from app.modules.wallet.router import router as wallet_router 
from app.modules.user.admin_router import router as admin_router

app = FastAPI(
    title="Marketplace E-commerce Platform",
    description="A complete marketplace solution as per the project architecture.",
    version="1.0.0"
)

# --- CORS CONFIGURATION ---
# Essential for allowing the Next.js frontend to talk to this FastAPI backend
origins = [
    "http://localhost:3000",    
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER INCLUSIONS ---

# 1. User Management (Signup, Login, Security)
app.include_router(user_router)

# 2. Seller Management (Stores, Dashboard Stats)
app.include_router(seller_router)

# 3. Product Management (Catalog, Inventory)
app.include_router(product_router)

# 4. Order Management (Checkout, Order Lifecycle, Payment Flow)
app.include_router(order_router)

# 5. Wallet & Financial Management (Ledger, Commissions, Balances)
app.include_router(wallet_router)

# 6. Admin Control Panel (Global Stats, System Management) - NEW
app.include_router(admin_router)

# --- BASE ENDPOINTS ---

@app.get("/")
def read_root():
    return {
        "message": "Marketplace API is Online",
        "docs": "/docs",
        "status": "Running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "database": "connected",
        "environment": "development"
    }