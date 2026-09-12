"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Clock, Truck, CheckCircle2, ArrowLeft, ShoppingBag, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetches all orders placed by the logged-in buyer
    api.get('/orders/my-purchases')
      .then(res => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  // Handler for Requesting a Return/Refund
  const handleRequestReturn = async (itemId: number) => {
    if(confirm("Request a return for this item? The Admin will review your request.")) {
        try {
            await api.post(`/orders/item/${itemId}/request-return`);
            alert("✅ Return Request Submitted!");
            window.location.reload(); // Refresh to update status to 'return_requested'
        } catch (err) {
            alert("Error: Only 'delivered' items can be returned.");
        }
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 italic">Loading your purchase history...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-10">
            <Link href="/" className="p-2 hover:bg-gray-200 rounded-full transition">
                <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Purchases</h1>
        </header>

        <div className="space-y-8">
          {orders.length > 0 ? orders.map((order: any) => (
            <div key={order.order_id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
              {/* Order Header */}
              <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Receipt ID</span>
                    <p className="font-black text-slate-900 text-xl">#{order.order_id}</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date</span>
                    <p className="font-bold text-slate-600">{new Date(order.date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="p-10 space-y-6">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                    <div className="flex items-center gap-5">
                        <div className="bg-white p-4 rounded-2xl shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Package size={32} />
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-xl">Product #{item.product_id}</p>
                            <p className="text-slate-400 font-bold uppercase text-[10px] mt-1">
                                Qty: {item.quantity} • Rs. {item.price.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-2">
                        {/* DYNAMIC STATUS BADGE */}
                        <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${
                            item.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                            item.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                            item.status === 'return_requested' ? 'bg-purple-100 text-purple-700' :
                            item.status === 'refunded' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                            {item.status === 'delivered' ? <CheckCircle2 size={14}/> : 
                             item.status === 'shipped' ? <Truck size={14}/> : 
                             item.status === 'return_requested' ? <RotateCcw size={14}/> :
                             <Clock size={14}/>}
                            {item.status.replace('_', ' ')}
                        </span>

                        {/* RETURN BUTTON: Appears only when Delivered */}
                        {item.status === 'delivered' && (
                            <button 
                                onClick={() => handleRequestReturn(item.id)}
                                className="text-[10px] font-black text-red-500 hover:text-red-700 hover:underline mt-1 uppercase tracking-widest flex items-center gap-1"
                            >
                                <RotateCcw size={10}/> Request Refund
                            </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-10 bg-blue-50/30 flex justify-between items-center border-t border-slate-100">
                <span className="text-xl font-bold text-slate-400">Grand Total</span>
                <span className="text-4xl font-black text-blue-700">Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>
          )) : (
            <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                <ShoppingBag size={80} className="mx-auto text-slate-100 mb-6" />
                <p className="text-slate-400 text-2xl font-bold">No orders found.</p>
                <Link href="/" className="mt-8 inline-block bg-blue-600 text-white px-10 py-4 rounded-3xl font-black text-lg hover:bg-blue-700 transition-all">
                    Go Shopping
                </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}