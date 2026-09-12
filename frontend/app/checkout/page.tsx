"use client"
import { useState } from 'react';
import { useCartStore, useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { CreditCard, Truck, CheckCircle, Loader2, Wallet, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!token) {
      alert("Security: Please login to place an order.");
      router.push('/login');
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setLoading(true);

    try {
      // Prepare data matching the Backend schemas.OrderCreate
      const orderPayload = {
        total_amount: total,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.id,
          seller_id: 0, // Backend will find real seller_id using product_id for safety
          price: item.price,
          quantity: item.quantity
        }))
      };

      // The 'api' instance now automatically attaches the Bearer token via interceptors
      const response = await api.post('/orders/create', orderPayload);

      alert(`🎉 Success! ${response.data.message}`);
      clearCart(); // Wipe the Zustand cart state
      router.push('/'); // Redirect to homepage
    } catch (err: any) {
      console.error("Order Submission Error:", err);
      
      // Better error messaging for the user
      const errorMessage = err.response?.data?.detail || "The server is currently unable to process your order. Please check your internet or try again later.";
      alert("Order Failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-4 mb-10">
            <Link href="/" className="p-2 hover:bg-gray-200 rounded-full transition">
                <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Checkout</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT COLUMN: Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-800">
                <Truck className="text-blue-600" size={28} /> Shipping & Items
              </h2>
              
              <div className="space-y-4">
                {cart.length > 0 ? cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{item.name}</p>
                      <p className="text-slate-500 text-sm">Qty: {item.quantity} • Price: Rs. {item.price.toLocaleString()}</p>
                    </div>
                    <span className="font-black text-slate-900 text-xl">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                )) : (
                  <div className="py-20 text-center text-slate-400">
                    <p>Your cart is empty. Start shopping to place an order!</p>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-10 pt-10 border-t-2 border-slate-50 flex justify-between items-center">
                    <span className="text-2xl font-medium text-slate-400">Grand Total</span>
                    <span className="text-5xl font-black text-blue-700">Rs. {total.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Payment & Action */}
          <div className="space-y-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-blue-50 sticky top-10">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <CreditCard className="text-blue-600" /> Payment Type
              </h2>

              <div className="space-y-3">
                <button 
                  onClick={() => setPaymentMethod("EasyPaisa/JazzCash")}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${paymentMethod === 'EasyPaisa/JazzCash' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <Wallet size={24} className={paymentMethod === 'EasyPaisa/JazzCash' ? 'text-blue-600' : 'text-slate-300'}/>
                  <div className="flex flex-col">
                    <span className={`text-sm ${paymentMethod === 'EasyPaisa/JazzCash' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>Digital Wallet</span>
                    <span className={paymentMethod === 'EasyPaisa/JazzCash' ? 'font-black' : 'font-medium'}>EasyPaisa / JazzCash</span>
                  </div>
                </button>

                <button 
                  onClick={() => setPaymentMethod("Cash on Delivery")}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${paymentMethod === 'Cash on Delivery' ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <Truck size={24} className={paymentMethod === 'Cash on Delivery' ? 'text-blue-600' : 'text-slate-300'}/>
                  <div className="flex flex-col">
                    <span className={`text-sm ${paymentMethod === 'Cash on Delivery' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>Logistics</span>
                    <span className={paymentMethod === 'Cash on Delivery' ? 'font-black' : 'font-medium'}>Cash on Delivery</span>
                  </div>
                </button>
              </div>

              <div className="mt-12">
                <button 
                  disabled={loading || cart.length === 0}
                  onClick={handlePlaceOrder}
                  className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24}/>}
                  {loading ? "Verifying..." : "Confirm & Place Order"}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-6 uppercase tracking-widest font-bold">
                  Secure Checkout Guaranteed
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}