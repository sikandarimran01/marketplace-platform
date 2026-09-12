from app.core.database import engine, Base

# --- IMPORT ALL MODELS ---
from app.modules.user.models import User
from app.modules.seller.models import Seller
from app.modules.product.models import Product
from app.modules.order.models import Order, OrderItem
from app.modules.wallet.models import Wallet, Transaction 

print("Wiping existing database and recreating with new columns...")

try:
    # 1. THIS IS THE MISSING STEP: Delete everything first
    Base.metadata.drop_all(bind=engine)
    print("🗑️ Old tables dropped.")

    # 2. Now create them again from scratch with the 'image_url' column
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database synced successfully! The 'image_url' column is now LIVE.")
    print("Note: All previous data has been reset. Please sign up again.")
except Exception as e:
    print(f"❌ Error: {e}")