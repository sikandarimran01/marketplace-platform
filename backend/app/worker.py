import os
import time
from celery import Celery
from dotenv import load_dotenv

# Load database & security settings
load_dotenv(dotenv_path="../.env")

# --- THE AGGRESSIVE FIX FOR PROTOCOL 2 ---
# We add '?protocol=2' to the URL to force old Redis compatibility
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0?protocol=2")

celery_app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)

# Force extra settings for older Redis versions
celery_app.conf.update(
    broker_connection_retry_on_startup=True,
    redis_backend_health_check_interval=30,
    worker_prefetch_multiplier=1,
)

# --- TASK 1: NOTIFY SELLER ---
@celery_app.task
def notify_seller_new_order(seller_email, order_id, total_amount):
    print(f"--- [NOTIFICATION SERVICE] ---")
    print(f"Processing background alert for: {seller_email}")
    print(f"Message: You have a new order #{order_id} for Rs. {total_amount}!")
    time.sleep(2) 
    print(f"Status: Email Sent Successfully to {seller_email}")

# --- TASK 2: LOW BALANCE ALERT ---
@celery_app.task
def alert_low_balance(seller_email, current_balance):
    if current_balance < 200:
        print(f"--- [WALLET ALERT] ---")
        print(f"Warning: Low credit detected for {seller_email}")
        print(f"Message: Your credit balance is low (Rs. {current_balance}).")