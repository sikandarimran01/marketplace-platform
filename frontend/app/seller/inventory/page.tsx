"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  BarChart3, AlertTriangle, AlertCircle, Package, ArrowLeft, 
  RotateCcw, Building2, History, Plus, Minus, CheckCircle2, 
  Search, X, LayoutDashboard, ShoppingCart, TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'overview', 'low_stock', 'out_of_stock', 'adjustment', 'history', 'warehouses', 'alerts'
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustment_type: 'add',
    quantity: 10,
    reason: 'Restock / Supplier Delivery',
    warehouse: 'Main Hub - Bay A'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, prodRes, histRes] = await Promise.all([
        api.get('/products/inventory/overview'),
        api.get('/products/my-products'),
        api.get('/products/inventory/history')
      ]);
      setOverview(ovRes.data);
      setProducts(prodRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.post('/products/inventory/adjust', {
        product_id: selectedProduct.id,
        adjustment_type: adjustForm.adjustment_type,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason,
        warehouse: adjustForm.warehouse
      });
      alert(`✅ Stock adjusted for ${selectedProduct.name}!`);
      setIsAdjustModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to adjust stock.");
    }
  };

  // Filtered lists
  const lowStockList = products.filter(p => p.stock > 0 && p.stock <= (p.low_stock_threshold || 5));
  const outOfStockList = products.filter(p => p.stock === 0);

  const displayedProducts = (
    activeTab === 'low_stock' ? lowStockList :
    activeTab === 'out_of_stock' ? outOfStockList :
    products
  ).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:block sticky top-0 h-screen">
        <h2 className="text-xl font-black mb-10 flex items-center gap-2 italic tracking-tighter">
          <BarChart3 className="text-blue-400" /> SellerHub
        </h2>
        <nav className="space-y-3">
          <Link href="/seller/dashboard" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <LayoutDashboard size={16}/> Dashboard
          </Link>
          <Link href="/seller/products" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <Package size={16}/> Products (Catalog)
          </Link>
          <div className="flex items-center gap-3 bg-blue-600 p-3.5 rounded-2xl shadow-lg font-bold text-xs uppercase tracking-wider text-white">
            <BarChart3 size={16}/> Inventory Control
          </div>
          <Link href="/seller/orders" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <ShoppingCart size={16}/> Orders
          </Link>
          <div className="pt-24">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-bold">
              <ArrowLeft size={16}/> Back to Shop
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Intelligence</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Real-time stock valuation, warehouse locations, and audit logs.</p>
          </div>
        </header>

        {/* --- 4 CORE METRIC CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Units</span>
            <p className="text-3xl font-black text-slate-900 mt-2">{overview?.total_units?.toLocaleString()} <span className="text-xs text-slate-400 font-bold">units</span></p>
            <p className="text-[10px] text-blue-600 font-bold mt-1">{overview?.total_skus} unique SKUs</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Valuation</span>
            <p className="text-3xl font-black text-blue-700 mt-2">Rs. {overview?.total_valuation?.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Retail value in stock</p>
          </div>

          <div className={`p-6 rounded-[2rem] border shadow-sm ${overview?.low_stock_count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1">
              <AlertTriangle size={14}/> Low Stock Warning
            </span>
            <p className="text-3xl font-black text-amber-700 mt-2">{overview?.low_stock_count} <span className="text-xs font-bold">items</span></p>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Stock ≤ 5 units</p>
          </div>

          <div className={`p-6 rounded-[2rem] border shadow-sm ${overview?.out_of_stock_count > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1">
              <AlertCircle size={14}/> Out of Stock
            </span>
            <p className="text-3xl font-black text-red-600 mt-2">{overview?.out_of_stock_count} <span className="text-xs font-bold">items</span></p>
            <p className="text-[10px] text-red-500 font-bold mt-1">Sales currently blocked</p>
          </div>

        </div>

        {/* --- TABS BAR --- */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide border-b border-slate-200">
          {[
            { id: 'overview', label: 'Stock Overview' },
            { id: 'low_stock', label: `⚠️ Low Stock (${overview?.low_stock_count || 0})` },
            { id: 'out_of_stock', label: `🚨 Out of Stock (${overview?.out_of_stock_count || 0})` },
            { id: 'history', label: '📜 Stock History (Audit Trail)' },
            { id: 'warehouses', label: '🏢 Warehouses / Hubs' },
            { id: 'alerts', label: '🔔 Inventory Alerts' }
          ].map(tab => (
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

        {/* --- VIEW 1: PRODUCTS STOCK LIST (Overview, Low Stock, Out of Stock) --- */}
        {['overview', 'low_stock', 'out_of_stock'].includes(activeTab) && (
          <div className="space-y-6">
            <div className="max-w-md relative">
              <Search className="absolute left-4 top-3 text-slate-400" size={18}/>
              <input 
                type="text"
                placeholder="Search stock by item name or SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5 pl-8">Item & SKU</th>
                    <th className="p-5">Warehouse</th>
                    <th className="p-5">Unit Price</th>
                    <th className="p-5">Available Stock</th>
                    <th className="p-5">Inventory Valuation</th>
                    <th className="p-5 text-right pr-8">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {displayedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-5 pl-8">
                        <p className="font-black text-slate-900">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">SKU: {p.sku || 'N/A'}</p>
                      </td>
                      <td className="p-5">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Building2 size={12}/> {p.warehouse || 'Main Hub - Bay A'}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-slate-600">Rs. {p.price.toLocaleString()}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                          p.stock === 0 ? 'bg-red-100 text-red-700' :
                          p.stock <= 5 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {p.stock === 0 ? 'Out of Stock' : `${p.stock} units`}
                        </span>
                      </td>
                      <td className="p-5 font-black text-blue-700">Rs. {(p.price * p.stock).toLocaleString()}</td>
                      <td className="p-5 text-right pr-8">
                        <button 
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsAdjustModalOpen(true);
                          }}
                          className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition shadow-sm"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayedProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-400 font-bold">No inventory matches found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- VIEW 2: STOCK HISTORY (AUDIT TRAIL) --- */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <History className="text-blue-600" /> Complete Inventory Ledger
              </h3>
              <span className="text-xs text-slate-400 font-bold">Last 50 changes recorded</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-5 pl-8">Date & Time</th>
                  <th className="p-5">Product</th>
                  <th className="p-5">Previous</th>
                  <th className="p-5">Adjustment</th>
                  <th className="p-5">New Stock</th>
                  <th className="p-5">Reason</th>
                  <th className="p-5 pr-8">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {history.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-5 pl-8 font-medium text-slate-500">{log.date}</td>
                    <td className="p-5 font-black text-slate-900">{log.product_name}</td>
                    <td className="p-5 text-slate-500 font-bold">{log.previous_stock}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${log.change_amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                      </span>
                    </td>
                    <td className="p-5 font-black text-slate-900">{log.new_stock}</td>
                    <td className="p-5 text-slate-700 font-medium">{log.reason}</td>
                    <td className="p-5 pr-8 text-slate-500 text-[11px]">{log.warehouse}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-slate-400 font-bold">No stock adjustments recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* --- VIEW 3: WAREHOUSES BREAKDOWN --- */}
        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {overview?.warehouses?.map((wh: any, i: number) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <h4 className="text-xl font-black text-slate-900">{wh.name}</h4>
                <div className="flex justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                  <span>Unique SKUs:</span>
                  <span className="font-black text-slate-900">{wh.skus} items</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-xs font-bold text-slate-500">
                  <span>Total Physical Units:</span>
                  <span className="font-black text-blue-700">{wh.units} units</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW 4: INVENTORY ALERTS --- */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {overview?.alerts?.map((a: any) => (
              <div key={a.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${a.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {a.stock === 0 ? <AlertCircle size={24}/> : <AlertTriangle size={24}/>}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{a.name}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase">SKU: {a.sku || 'N/A'} • Current: {a.stock} units (Threshold: {a.threshold})</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedProduct(a);
                    setIsAdjustModalOpen(true);
                  }}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition"
                >
                  Restock Now
                </button>
              </div>
            ))}
            {overview?.alerts?.length === 0 && (
              <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100">
                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3"/>
                <p className="font-black text-slate-900 text-lg">All Stock Levels Healthy!</p>
                <p className="text-xs text-slate-400 font-medium">No items currently below low stock threshold.</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- STOCK ADJUSTMENT MODAL --- */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsAdjustModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Stock Adjustment</h2>
            <p className="text-xs text-slate-400 mb-6">{selectedProduct?.name} (Current: {selectedProduct?.stock} units)</p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              
              {/* Type: Add / Subtract / Set */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'add', label: '+ Restock' },
                    { id: 'subtract', label: '- Remove' },
                    { id: 'set', label: '= Set To' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAdjustForm({...adjustForm, adjustment_type: t.id})}
                      className={`p-2.5 rounded-xl text-xs font-black uppercase transition ${
                        adjustForm.adjustment_type === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={adjustForm.quantity}
                  onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value) || 0})}
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Reason for Audit Log</label>
                <select 
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 bg-white"
                >
                  <option>Restock / Supplier Delivery</option>
                  <option>Physical Count Correction</option>
                  <option>Damaged / Expired Goods</option>
                  <option>Customer Return Restock</option>
                  <option>Internal Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Warehouse Facility</label>
                <input 
                  type="text"
                  value={adjustForm.warehouse}
                  onChange={e => setAdjustForm({...adjustForm, warehouse: e.target.value})}
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-700 transition mt-4">
                Confirm & Log Adjustment
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}