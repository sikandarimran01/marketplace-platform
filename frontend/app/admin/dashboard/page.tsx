"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { 
  Users, Store, Package, BarChart3, ShieldCheck, 
  ArrowLeft, TrendingUp, RotateCcw, CheckCircle, 
  XCircle, AlertCircle, Loader2 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [refundQueue, setRefundQueue] = useState<any[]>([]); // NEW: Refund requests
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, refundRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        // Note: You may need to add a "GET /admin/refund-requests" endpoint 
        // to your backend admin_router.py for this to be 100% dynamic.
        api.get('/admin/refund-requests').catch(() => ({ data: [] })) 
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setRefundQueue(refundRes.data);
    } catch (err) {
      console.error("Admin Access Error:", err);
      alert("Access Denied: Only Administrators can view this page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // --- NEW: HANDLER TO APPROVE REFUND ---
  const handleApproveRefund = async (itemId: number) => {
    if(!confirm("Approve this refund? Stock will be restored and seller will be refunded their commission.")) return;
    
    setProcessingId(itemId);
    try {
      await api.post(`/orders/item/${itemId}/approve-refund`);
      alert("✅ Refund Processed Successfully!");
      fetchAdminData(); // Refresh the whole dashboard
    } catch (err) {
      alert("Failed to process refund.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
            <Loader2 className="animate-spin text-purple-500 mx-auto mb-4" size={48} />
            <p className="font-black text-purple-400 uppercase tracking-[0.3em] text-sm">Initializing Secure Terminal</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-purple-900 text-white p-8 space-y-8 hidden lg:block">
        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-purple-900"><ShieldCheck size={20} /></div>
            Core Admin
        </h2>
        <nav className="space-y-4 pt-10">
            <div className="bg-purple-800 p-4 rounded-2xl font-bold border-l-4 border-white flex items-center gap-3">
                <BarChart3 size={18}/> Platform Overview
            </div>
            <div className="p-4 text-purple-300 font-medium hover:text-white cursor-pointer transition-colors flex items-center gap-3">
                <Users size={18}/> User Directory
            </div>
            <div className="p-4 text-purple-300 font-medium hover:text-white cursor-pointer transition-colors flex items-center gap-3 relative">
                <RotateCcw size={18}/> Refund Queue
                {refundQueue.length > 0 && <span className="absolute right-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{refundQueue.length}</span>}
            </div>
            
            <div className="pt-20">
                <Link href="/" className="flex items-center gap-2 text-purple-400 hover:text-white transition font-bold uppercase text-xs tracking-widest">
                    <ArrowLeft size={16}/> Return to Store
                </Link>
            </div>
        </nav>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Analytics</h1>
                <p className="text-slate-500 font-medium mt-1">Real-time performance metrics for the Marketplace Platform</p>
            </div>
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                Mainnet Live
            </div>
        </header>

        {/* ADMIN ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-t-8 border-purple-600 group hover:shadow-xl transition-all">
            <div className="bg-purple-50 p-3 rounded-2xl w-fit mb-4 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <TrendingUp size={24} />
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Global Commission Revenue</p>
            <p className="text-3xl font-black text-slate-900 mt-1">Rs. {stats?.platform_revenue?.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm">
            <Users className="text-blue-500 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Active Users</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats?.users_count}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm">
            <Store className="text-green-500 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Verified Stores</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats?.sellers_count}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm">
            <Package className="text-amber-500 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Listed Inventory</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats?.products_count}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* REFUND QUEUE SECTION */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-red-50 overflow-hidden flex flex-col">
                <div className="p-8 bg-red-50 border-b border-red-100 flex justify-between items-center">
                    <h3 className="text-2xl font-black text-red-900 flex items-center gap-3">
                        <RotateCcw /> Refund Requests
                    </h3>
                    <span className="bg-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-black">{refundQueue.length} PENDING</span>
                </div>
                
                <div className="flex-1 overflow-y-auto max-h-[500px] p-6 space-y-4">
                    {refundQueue.length > 0 ? refundQueue.map((req) => (
                        <div key={req.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                            <div>
                                <p className="font-black text-slate-900">Item #{req.id}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Product ID: {req.product_id} • Seller ID: {req.seller_id}</p>
                                <div className="mt-2 flex items-center gap-2 text-red-600">
                                    <AlertCircle size={14}/>
                                    <span className="text-[10px] font-black uppercase">Buyer is requesting money back</span>
                                </div>
                            </div>
                            <button 
                                disabled={processingId === req.id}
                                onClick={() => handleApproveRefund(req.id)}
                                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-100 disabled:opacity-50"
                            >
                                {processingId === req.id ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle size={14}/>}
                                Approve & Restore
                            </button>
                        </div>
                    )) : (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <CheckCircle size={60} className="text-slate-200" />
                            <p className="text-slate-400 font-bold italic">Queue is clear. No active return requests.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* USER MANAGEMENT TABLE */}
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900">System Directory</h3>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[500px]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase sticky top-0">
                            <tr>
                                <th className="p-6 pl-8">Name</th>
                                <th className="p-6">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6 pl-8">
                                        <p className="font-black text-slate-900">{u.full_name}</p>
                                        <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${
                                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                            u.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}