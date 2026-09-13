"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Package, ArrowLeft, Clock, CheckCircle, Truck, 
  Loader2, Download, Search, AlertCircle, RefreshCw, 
  CheckCheck, XCircle, RotateCcw, LayoutDashboard, ShoppingCart,
  BarChart3

} from 'lucide-react';
import Link from 'next/link';

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  
  // 12 Filter Tabs State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'new', label: 'New Orders' },
    { id: 'payment_verified', label: 'Payment Verified' },
    { id: 'processing', label: 'Processing' },
    { id: 'ready_to_ship', label: 'Ready to Ship' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'return_period', label: 'Return Period' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'returned', label: 'Returned' },
    { id: 'refunded', label: 'Refunded' },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/orders/seller/my-orders?status_filter=${activeTab}`;
      if (searchQuery) url += `&q=${searchQuery}`;
      const res = await api.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  // Handler for advancing order status in lifecycle
  const handleUpdateStatus = async (itemId: number, newStatus: string) => {
    setLoadingId(itemId);
    try {
      await api.patch(`/orders/item/${itemId}/status`, { new_status: newStatus });
      await fetchOrders();
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setLoadingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const res = await api.get('/orders/seller/export-csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'store_orders.csv';
      link.click();
    } catch (err) {
      alert("Export failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      
      {/* Sidebar matching SellerHub */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:block sticky top-0 h-screen">
        <h2 className="text-xl font-black mb-10 flex items-center gap-2 italic tracking-tighter">
          <Package className="text-blue-400" /> SellerHub
        </h2>
        <nav className="space-y-3">
          <Link href="/seller/dashboard" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <LayoutDashboard size={16}/> Dashboard
          </Link>
          <Link href="/seller/products" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <Package size={16}/> Products (Catalog)
          </Link>
          <Link href="/seller/inventory" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <BarChart3 size={16}/> Inventory Control
          </Link>
          <div className="flex items-center gap-3 bg-blue-600 p-3.5 rounded-2xl shadow-lg font-bold text-xs uppercase tracking-wider text-white">
            <ShoppingCart size={16}/> Orders (Active)
          </div>
          <div className="pt-28">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-bold">
              <ArrowLeft size={16}/> Back to Shop
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Orders Lifecycle Management</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Track payments, process shipments, and manage returns & cancellations.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleExportCSV}
              className="bg-white border-2 border-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl font-black text-xs hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
            >
              <Download size={15}/> Export Orders (.CSV)
            </button>
            <button 
              onClick={fetchOrders}
              className="bg-slate-100 text-slate-700 p-2.5 rounded-2xl hover:bg-slate-200 transition"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* --- 12 FILTER TABS BAR --- */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6 max-w-md relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-slate-400" size={18}/>
            <input 
              type="text"
              placeholder="Search by Order ID, Product, or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium outline-none focus:border-blue-500"
            />
          </div>
          <button onClick={fetchOrders} className="bg-slate-900 text-white px-4 rounded-2xl text-xs font-bold">
            Search
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-5 pl-8">Order & Item</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Amount</th>
                <th className="p-5">Method</th>
                <th className="p-5">Lifecycle Status</th>
                <th className="p-5 text-right pr-8">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 text-xs">
              {orders.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  {/* Order & Product */}
                  <td className="p-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">Order #{item.order_id}</p>
                        <p className="text-[11px] font-bold text-slate-600 truncate max-w-[180px]">{item.product_name}</p>
                        <p className="text-[10px] text-slate-400">{item.order_date}</p>
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="p-5">
                    <p className="font-bold text-slate-800">{item.customer_name}</p>
                    <p className="text-[10px] text-slate-400">{item.customer_email}</p>
                  </td>

                  {/* Price & Quantity */}
                  <td className="p-5">
                    <p className="font-black text-blue-700 text-sm">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Qty: {item.quantity} × Rs. {item.price}</p>
                  </td>

                  {/* Payment */}
                  <td className="p-5 font-black uppercase text-[10px] text-slate-600">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">{item.payment_method}</span>
                  </td>

                  {/* Dynamic Lifecycle Status Badge */}
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'return_period' ? 'bg-teal-100 text-teal-700' :
                      item.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'ready_to_ship' ? 'bg-cyan-100 text-cyan-700' :
                      item.status === 'processing' ? 'bg-indigo-100 text-indigo-700' :
                      item.status === 'payment_verified' ? 'bg-sky-100 text-sky-700' :
                      item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      item.status === 'cancelled' ? 'bg-slate-200 text-slate-700' :
                      item.status === 'return_requested' || item.status === 'returned' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Action Pipeline Buttons */}
                  <td className="p-5 text-right pr-8">
                    <div className="flex justify-end gap-2 items-center">
                      
                      {/* Step 1: New / Pending -> Verify Payment */}
                      {item.status === 'pending' && (
                        <>
                          <button 
                            disabled={loadingId === item.id}
                            onClick={() => handleUpdateStatus(item.id, 'payment_verified')}
                            className="bg-sky-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-sky-700 transition"
                          >
                            Verify Payment
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                            className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {/* Step 2: Payment Verified -> Start Processing */}
                      {item.status === 'payment_verified' && (
                        <button 
                          disabled={loadingId === item.id}
                          onClick={() => handleUpdateStatus(item.id, 'processing')}
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-700 transition"
                        >
                          Process Order
                        </button>
                      )}

                      {/* Step 3: Processing -> Ready to Ship */}
                      {item.status === 'processing' && (
                        <button 
                          disabled={loadingId === item.id}
                          onClick={() => handleUpdateStatus(item.id, 'ready_to_ship')}
                          className="bg-cyan-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-cyan-700 transition"
                        >
                          Ready to Ship
                        </button>
                      )}

                      {/* Step 4: Ready to Ship -> Ship */}
                      {item.status === 'ready_to_ship' && (
                        <button 
                          disabled={loadingId === item.id}
                          onClick={() => handleUpdateStatus(item.id, 'shipped')}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Truck size={12}/> Dispatch
                        </button>
                      )}

                      {/* Step 5: Shipped -> Deliver */}
                      {item.status === 'shipped' && (
                        <button 
                          disabled={loadingId === item.id}
                          onClick={() => handleUpdateStatus(item.id, 'delivered')}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 transition flex items-center gap-1"
                        >
                          <CheckCircle size={12}/> Mark Delivered
                        </button>
                      )}

                      {/* Step 6: Delivered -> Return Period */}
                      {item.status === 'delivered' && (
                        <button 
                          disabled={loadingId === item.id}
                          onClick={() => handleUpdateStatus(item.id, 'return_period')}
                          className="bg-teal-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-teal-700 transition"
                        >
                          Start Return Period
                        </button>
                      )}

                      {/* Step 7: Return Period -> Complete Order */}
                      {item.status === 'return_period' && (
                        <button 
                          disabled={loadingId === item.id}
                          onClick={() => handleUpdateStatus(item.id, 'completed')}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <CheckCheck size={12}/> Complete Order
                        </button>
                      )}

                      {/* Terminal States */}
                      {item.status === 'completed' && (
                        <span className="text-green-600 font-black text-[10px] uppercase flex items-center gap-1">
                          <CheckCheck size={14}/> Completed
                        </span>
                      )}

                      {item.status === 'cancelled' && (
                        <span className="text-slate-400 font-black text-[10px] uppercase">
                          Cancelled (Restored)
                        </span>
                      )}

                      {item.status === 'return_requested' && (
                        <span className="text-purple-600 font-black text-[10px] uppercase">
                          Under Admin Review
                        </span>
                      )}

                      {item.status === 'refunded' && (
                        <span className="text-red-500 font-black text-[10px] uppercase">
                          Refunded & Closed
                        </span>
                      )}

                    </div>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-400 font-bold">
                    No orders found under "{activeTab}". Place a test purchase to see it here!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>

    </div>
  );
}