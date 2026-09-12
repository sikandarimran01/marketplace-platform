def calculate_commission(amount: float, rate: float = 0.10):
    """Calculates a 10% commission by default"""
    commission = amount * rate
    seller_share = amount - commission
    return commission, seller_share