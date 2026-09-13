"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api'; 
import { useAuthStore } from '@/lib/store';
import { 
  DollarSign, Wallet, Package, LayoutDashboard, PlusCircle, 
  ArrowLeft, X, Clock, CheckCircle2, ShoppingBag, Edit3, 
  Store, Users, Truck, AlertCircle, TrendingUp, BarChart2,BarChart3,
  Percent, ArrowUpRight, ArrowDownLeft, Image as ImageIcon,
  ShoppingCart, Layers
} from 'lucide-react';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';

export default function SellerDashboard() {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]); 
  const [myProducts, setMyProducts] = useState<any[]>([]); 
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(true); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  
  // Enhanced Form State with Category, SKU, Status & Variants
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    price: 0,
    stock: 0,
    sku: '',
    status: 'approved',
    image_url: '',
    variants: [] as { name: string; price: number; stock: number }[]
  });

  const [newVariant, setNewVariant] = useState({ name: '', price: 0, stock: 0 });

  const fetchDashboardData = async () => {
    if (token) {
      try {
        const [statsRes, ordersRes, productsRes, walletRes] = await Promise.all([
          api.get('/sellers/dashboard/stats'),
          api.get('/orders/seller/my-orders'),
          api.get('/products/my-products'),
          api.get('/wallet/my-wallet')
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data);
        setMyProducts(productsRes.data);
        setWalletData(walletRes.data);
        setHasStore(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasStore(false);
        }
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => { fetchDashboardData(); }, [token]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        variants: productForm.variants.length > 0 ? JSON.stringify(productForm.variants) : null
      };
      await api.post('/products/add', payload);
      alert("🎉 Product Added Successfully!");
      setIsModalOpen(false); 
      setProductForm({
        name: '',
        description: '',
        category: 'Electronics',
        price: 0,
        stock: 0,
        sku: '',
        status: 'approved',
        image_url: '',
        variants: []
      });
      fetchDashboardData(); 
    } catch (err) {
      alert("Error adding product. Please try again.");
    }
  };

  const addVariant = () => {
    if (!newVariant.name) return;
    setProductForm({
      ...productForm,
      variants: [...productForm.variants, newVariant]
    });
    setNewVariant({ name: '', price: productForm.price, stock: 5 });
  };

  const removeVariant = (index: number) => {
    setProductForm({
      ...productForm,
      variants: productForm.variants.filter((_, i) => i !== index)
    });
  };

  const handleTopUp = async () => {
    const amount = prompt("Enter amount to deposit into Wallet (e.g. 1000):");
    if (amount && !isNaN(Number(amount))) {
        try {
            await api.post('/wallet/top-up', { amount: Number(amount) });
            alert("✅ Deposit Successful!");
            fetchDashboardData(); 
        } catch (e) { alert("Deposit failed. Check connection."); }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Loading Store Analytics...</p>
        </div>
    </div>
  );

  if (!hasStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl text-center border border-slate-100">
          <Store className="mx-auto text-blue-600 mb-6" size={64} />
          <h2 className="text-3xl font-black mb-4 text-slate-900">Create Your Store</h2>
          <p className="text-slate-500 mb-10 font-medium">Register your store name to access inventory, sales analytics, and wallet tracking.</p>
          <button 
             onClick={async () => {
                const name = prompt("Enter your unique Store Name:");
                if(name) {
                  try {
                    await api.post('/sellers/create-store', { store_name: name });
                    fetchDashboardData(); 
                  } catch (e) { alert("Error creating store. Try another name."); }
                }
             }}
             className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-bold hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95"
          >
            Open Store Now
          </button>
        </div>
      </div>
    );
  }

  const maxChartAmount = Math.max(...(stats?.sales_chart?.map((d: any) => d.amount) || [1]), 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      
      {/* Sidebar with Direct Navigation to Products and Orders */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:block sticky top-0 h-screen">
        <h2 className="text-xl font-black mb-10 flex items-center gap-2 italic tracking-tighter">
          <LayoutDashboard className="text-blue-400" /> SellerHub
        </h2>
        <nav className="space-y-3">
          <div className="flex items-center gap-3 bg-blue-600 p-3.5 rounded-2xl shadow-lg font-bold text-xs uppercase tracking-wider text-white">
            <TrendingUp size={16} /> Dashboard
          </div>
          
          <div className="text-slate-500 text-[10px] font-black uppercase mt-8 mb-2 px-3 tracking-widest">Catalog & Orders</div>
          
          {/* LINK TO COMPLETE PRODUCTS MANAGEMENT */}
          <Link href="/seller/products" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <Package size={16}/> Products (Manage)
          </Link>

            {/* 📍 PASTE INVENTORY LINK HERE 📍 */}
          <Link href="/seller/inventory" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <BarChart3 size={16}/> Inventory Control
          </Link>

          <Link href="/seller/orders" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <ShoppingCart size={16}/> Orders
          </Link>

          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs w-full text-left">
            <PlusCircle size={16}/> Quick Add Item
          </button>

          <div className="pt-24">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-bold">
              <ArrowLeft size={16}/> Back to Shop
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{stats?.store_name}</h1>
              <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-3 py-1 rounded-full">Store Live</span>
            </div>
            <p className="text-slate-400 font-medium text-xs mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleTopUp}
              className="bg-white border-2 border-slate-200 text-slate-800 px-5 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
            >
              <Wallet size={16} className="text-blue-600"/> Top-up Wallet
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-blue-700 shadow-xl shadow-blue-200 transition flex items-center gap-2 active:scale-95"
            >
              <PlusCircle size={16}/> Add Product
            </button>
          </div>
        </header>

        {/* --- 1. TOP STATS ROW --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today's Sales</span>
              <div className="bg-green-50 p-2.5 rounded-xl text-green-600"><DollarSign size={18}/></div>
            </div>
            <p className="text-3xl font-black text-slate-900">Rs. {stats?.today_sales?.toLocaleString()}</p>
            <p className="text-[10px] text-green-600 font-bold mt-1">Live updates for today</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sales</span>
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><TrendingUp size={18}/></div>
            </div>
            <p className="text-3xl font-black text-blue-700">Rs. {stats?.total_sales?.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Gross physical revenue</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Orders</span>
              <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600"><Package size={18}/></div>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats?.total_orders}</p>
            <p className="text-[10px] text-purple-600 font-bold mt-1">All-time receipts</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Pipeline</span>
              <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><Truck size={18}/></div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black text-amber-600">{stats?.pending_orders}</p>
                <p className="text-[9px] font-bold uppercase text-slate-400">Pending / Shipped</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-green-600">{stats?.delivered_orders}</p>
                <p className="text-[9px] font-bold uppercase text-slate-400">Delivered</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. SECONDARY STATS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Products</span>
              <ShoppingBag size={18} className="text-slate-400"/>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats?.total_products} <span className="text-xs font-bold text-slate-400">items</span></p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customers</span>
              <Users size={18} className="text-slate-400"/>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats?.total_customers} <span className="text-xs font-bold text-slate-400">buyers</span></p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-[2rem] shadow-lg shadow-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Available Wallet</span>
              <Wallet size={18} className="text-[#B3E52B]"/>
            </div>
            <p className="text-2xl font-black">Rs. {stats?.wallet_balance?.toLocaleString()}</p>
            <p className="text-[9px] font-bold text-blue-200 mt-1 uppercase">Pre-paid Fee Credit</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commissions</span>
              <Percent size={18} className="text-slate-400"/>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-lg font-black text-slate-800">Rs. {stats?.total_commission_paid?.toLocaleString()}</p>
                <p className="text-[8px] font-bold uppercase text-slate-400">Total Paid (10%)</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-amber-600">Rs. {stats?.pending_commission?.toLocaleString()}</p>
                <p className="text-[8px] font-bold uppercase text-slate-400">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- 3. SALES CHART --- */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="text-blue-600" /> Sales Trend (Last 7 Days)
              </h3>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Daily gross revenue performance</p>
            </div>
            <span className="text-xs font-black uppercase bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full">Weekly Trend</span>
          </div>

          <div className="h-48 flex items-end gap-3 sm:gap-6 pt-6 border-b border-slate-100">
            {stats?.sales_chart?.map((bar: any, index: number) => {
              const heightPercent = Math.max((bar.amount / maxChartAmount) * 100, 4);
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mb-1 whitespace-nowrap">
                    Rs. {bar.amount.toLocaleString()}
                  </div>
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-2xl transition-all duration-500 group-hover:bg-blue-600 ${bar.amount > 0 ? 'bg-blue-500' : 'bg-slate-100'}`}
                  ></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 mt-3">{bar.day}</span>
                  <span className="text-[8px] font-medium text-slate-300">{bar.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 4. RECENT ORDERS TABLE --- */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-10">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="text-amber-500" /> Recent Orders
              </h3>
              <p className="text-slate-400 text-xs font-medium">Orders containing your products</p>
            </div>
            <Link href="/seller/orders" className="text-xs font-black text-blue-600 hover:underline uppercase">
              Manage All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="p-6">Order ID</th>
                  <th className="p-6">Product ID</th>
                  <th className="p-6">Amount</th>
                  <th className="p-6">Quantity</th>
                  <th className="p-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {recentOrders?.slice(0, 6).map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="p-6 font-black text-slate-900">#{order.order_id || order.id}</td>
                    <td className="p-6 text-slate-500 font-bold">Item #{order.product_id}</td>
                    <td className="p-6 font-black text-blue-700">Rs. {order.price?.toLocaleString()}</td>
                    <td className="p-6 font-bold text-slate-700">{order.quantity} units</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status === 'delivered' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                        {order.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-slate-400 font-medium italic">
                      No sales yet. Once customers place orders, they will appear here instantly!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- 5. ACTIVE INVENTORY PREVIEW WITH DIRECT LINK TO CATALOG --- */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShoppingBag className="text-blue-600" /> Active Inventory ({myProducts.length})
              </h3>
              <p className="text-xs text-slate-400 font-medium">Quick preview of your live products</p>
            </div>
            <Link href="/seller/products" className="text-xs font-black text-blue-600 hover:underline uppercase flex items-center gap-1">
              Open Full Catalog & Variants Center →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {myProducts.slice(0, 6).map((p: any) => (
              <div key={p.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <Package size={28} className="text-slate-200" />
                  )}
                </div>
                <p className="font-black text-xs text-slate-900 truncate">{p.name}</p>
                <p className="text-blue-700 font-black text-xs mt-0.5">Rs. {p.price.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Stock: {p.stock}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* ENHANCED ADD PRODUCT MODAL WITH CATEGORIES, SKU, STATUS & VARIANTS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
              <X size={28} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Add New Product</h2>
            <p className="text-xs text-slate-400 mb-6">List a new item with image, category, status, and variants.</p>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              
              {/* Image Upload */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Product Photo</label>
                <CldUploadWidget 
                  uploadPreset="marketplace_preset" 
                  onSuccess={(result: any) => setProductForm({ ...productForm, image_url: result.info.secure_url })}
                >
                  {({ open }) => (
                    <button 
                      type="button" 
                      onClick={() => open()}
                      className="w-full border-2 border-dashed border-slate-200 p-4 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      {productForm.image_url ? (
                        <span className="text-green-600 font-black flex items-center gap-1"><CheckCircle2 size={16}/> Photo Ready</span>
                      ) : (
                        <span className="flex items-center gap-1"><ImageIcon size={16}/> Upload Image via Cloudinary</span>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
              </div>

              {/* Title & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Item Title</label>
                  <input type="text" className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500" required
                    value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">SKU (Stock Identifier)</label>
                  <input type="text" placeholder="e.g. ITEM-001" className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                    value={productForm.sku} onChange={(e) => setProductForm({...productForm, sku: e.target.value})} />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
                  <select 
                    value={productForm.category} 
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 bg-white"
                  >
                    <option>Electronics</option>
                    <option>Fashion</option>
                    <option>Home & Kitchen</option>
                    <option>Beauty</option>
                    <option>Groceries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Initial Status</label>
                  <select 
                    value={productForm.status} 
                    onChange={(e) => setProductForm({...productForm, status: e.target.value})}
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="approved">Approved (Publish Live)</option>
                    <option value="pending">Submit for Admin Approval</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Base Price (Rs.)</label>
                  <input type="number" className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500" required
                    value={productForm.price || ''} onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Initial Stock Units</label>
                  <input type="number" className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500" required
                    value={productForm.stock || ''} onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Description</label>
                <textarea className="w-full border border-slate-200 p-3 rounded-xl text-xs font-medium outline-none focus:border-blue-500 h-20"
                  value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})}></textarea>
              </div>

              {/* Variants Builder */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Variants (Optional: Sizes/Colors)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Variant (e.g. Red / XL)" value={newVariant.name}
                    onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                    className="flex-1 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none" />
                  <input type="number" placeholder="Price" value={newVariant.price || ''}
                    onChange={(e) => setNewVariant({...newVariant, price: parseFloat(e.target.value) || 0})}
                    className="w-24 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none" />
                  <input type="number" placeholder="Stock" value={newVariant.stock || ''}
                    onChange={(e) => setNewVariant({...newVariant, stock: parseInt(e.target.value) || 0})}
                    className="w-20 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none" />
                  <button type="button" onClick={addVariant} className="bg-slate-900 text-white px-3.5 rounded-xl text-xs font-black">
                    + Add
                  </button>
                </div>

                {productForm.variants.length > 0 && (
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl">
                    {productForm.variants.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-white p-2 px-3 rounded-lg border border-slate-100">
                        <span className="font-bold">{v.name}</span>
                        <span className="text-blue-600 font-black">Rs. {v.price} ({v.stock} in stock)</span>
                        <button type="button" onClick={() => removeVariant(i)} className="text-red-500 hover:text-red-700">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-700 shadow-xl shadow-blue-200 transition mt-4">
                Publish Product to Store
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}