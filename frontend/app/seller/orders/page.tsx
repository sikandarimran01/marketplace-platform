"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, ArrowLeft, Clock, CheckCircle, Truck, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Reusable fetch function to refresh data after status updates
  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/seller/my-orders');
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handler to update Order Item status (Lifecycle Management)
  const handleUpdateStatus = async (itemId: number, newStatus: string) => {
    setLoadingId(itemId);
    try {
      await api.patch(`/orders/item/${itemId}/status`, { new_status: newStatus });
      await fetchOrders(); // Refresh the list to show new status
    } catch (err) {
      alert("Failed to update status. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-6xl mx-auto">
        <Link href="/seller/dashboard" className="flex items-center gap-2 text-gray-500 mb-6 hover:text-blue-600 transition-colors">
            <ArrowLeft size={18}/> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-black mb-8">Manage Orders</h1>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest">Product ID</th>
                <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest">Amount</th>
                <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest">Quantity</th>
                <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest">Status</th>
                <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((item: any) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-6 font-medium text-slate-600">#{item.product_id}</td>
                  <td className="p-6 font-black text-slate-900 text-lg">Rs. {item.price.toLocaleString()}</td>
                  <td className="p-6 font-bold text-slate-500">{item.quantity} units</td>
                  <td className="p-6">
                    {/* DYNAMIC STATUS BADGE */}
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 w-fit ${
                        item.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                        item.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 
                        'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status === 'delivered' ? <CheckCircle size={12}/> : item.status === 'shipped' ? <Truck size={12}/> : <Clock size={12}/>}
                      {item.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    {/* DYNAMIC ACTION BUTTONS */}
                    {item.status === 'pending' && (
                        <button 
                            disabled={loadingId === item.id}
                            onClick={() => handleUpdateStatus(item.id, 'shipped')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2 ml-auto"
                        >
                            {loadingId === item.id ? <Loader2 size={14} className="animate-spin"/> : <Truck size={14}/>}
                            Ship Order
                        </button>
                    )}

                    {item.status === 'shipped' && (
                        <button 
                            disabled={loadingId === item.id}
                            onClick={() => handleUpdateStatus(item.id, 'delivered')}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center gap-2 ml-auto"
                        >
                            {loadingId === item.id ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                            Confirm Delivery
                        </button>
                    )}

                    {item.status === 'delivered' && (
                        <span className="text-slate-400 text-xs font-bold flex items-center justify-end gap-1 italic">
                            <CheckCircle size={14} className="text-green-500"/> Order Completed
                        </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {orders.length === 0 && (
            <div className="py-24 text-center">
                <Package size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No sales yet. Your orders will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}