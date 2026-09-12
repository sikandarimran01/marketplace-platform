"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api'; 
import { useAuthStore } from '@/lib/store';
import { 
  DollarSign, Wallet, Package, LayoutDashboard, PlusCircle, 
  ArrowLeft, X, Clock, CheckCircle2, ShoppingBag, Edit3, 
  ArrowUpRight, ArrowDownLeft, Store, Image as ImageIcon 
} from 'lucide-react';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary'; // NEW: Cloudinary Integration

export default function SellerDashboard() {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]); 
  const [myProducts, setMyProducts] = useState<any[]>([]); 
  const [walletData, setWalletData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(true); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  
  // UPDATED: Added image_url to the form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    image_url: '' 
  });

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
        console.error("Data Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => { fetchDashboardData(); }, [token]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products/add', productForm);
      alert("🎉 Product Added Successfully!");
      setIsModalOpen(false); 
      // Reset form including image
      setProductForm({ name: '', description: '', price: 0, stock: 0, image_url: '' });
      fetchDashboardData(); 
    } catch (err) {
      alert("Error adding product. Please try again.");
    }
  };

  const handleTopUp = async () => {
    const amount = prompt("Enter amount to deposit via EasyPaisa (e.g. 1000):");
    if (amount && !isNaN(Number(amount))) {
        try {
            await api.post('/wallet/top-up', { amount: Number(amount) });
            alert("✅ Deposit Successful! Your credit balance has been updated.");
            fetchDashboardData(); 
        } catch (e) { 
            alert("Deposit failed. Please check your connection."); 
        }
    } else if (amount) {
        alert("Please enter a valid number.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="font-bold text-gray-600 uppercase tracking-widest text-sm">Syncing Data...</p>
        </div>
    </div>
  );

  if (!hasStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl text-center border border-slate-100">
          <Store className="mx-auto text-blue-600 mb-6" size={64} />
          <h2 className="text-3xl font-black mb-4 text-slate-900">Create Your Store</h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">You need to register a store name before you can list products and track earnings.</p>
          <button 
             onClick={async () => {
                const name = prompt("Enter your unique Store Name:");
                if(name) {
                  try {
                    await api.post('/sellers/create-store', { store_name: name });
                    fetchDashboardData(); 
                  } catch (e) { alert("Name taken or Error. Try again."); }
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-10 flex items-center gap-2">
          <LayoutDashboard className="text-blue-400" /> Marketplace
        </h2>
        <nav className="space-y-4">
          <Link href="/seller/dashboard" className="flex items-center gap-2 bg-blue-600 p-3 rounded-xl shadow-lg font-bold">Dashboard</Link>
          <div className="text-gray-500 text-xs font-bold uppercase mt-10 mb-2 px-2">Management</div>
          <button className="flex items-center gap-2 text-gray-400 p-2 w-full text-left hover:text-white transition">Inventory</button>
          <Link href="/seller/orders" className="flex items-center gap-2 text-gray-400 p-2 w-full text-left hover:text-white transition">Orders</Link>
          <Link href="/" className="flex items-center gap-2 pt-20 text-gray-400 hover:text-white transition">
            <ArrowLeft size={16}/> Back to Shop
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Store: {stats?.store_name}</h1>
            <p className="text-slate-500 font-medium tracking-wide italic">{user?.email}</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            <PlusCircle size={20}/> Add Product
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="bg-green-100 p-3 w-fit rounded-2xl mb-4 text-green-600"><DollarSign /></div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest">Total Physical Sales</h3>
            <p className="text-4xl font-black text-slate-900 mt-1">Rs. {stats?.total_sales?.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">Cash on Delivery (In-hand)</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative group overflow-hidden">
            <div className="bg-blue-100 p-3 w-fit rounded-2xl mb-4 text-blue-600"><Wallet /></div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest">Available Credit</h3>
            <p className="text-4xl font-black text-blue-700 mt-1">Rs. {walletData?.balance?.toLocaleString()}</p>
            <button onClick={handleTopUp} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all active:scale-95">
                Top-up via EasyPaisa
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="bg-purple-100 p-3 w-fit rounded-2xl mb-4 text-purple-600"><Package /></div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest">Live Products</h3>
            <p className="text-4xl font-black text-slate-900 mt-1">{myProducts.length}</p>
          </div>
        </div>

        {/* FINANCIAL LEDGER SECTION */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 mb-10">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-8">
            <Wallet className="text-blue-600" /> Financial Ledger
          </h3>
          <div className="space-y-4">
            {walletData?.transactions?.length > 0 ? walletData.transactions.slice(0, 5).map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tx.type === 'deposit' || tx.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.type === 'deposit' ? <PlusCircle size={20}/> : tx.type === 'commission_deduction' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{tx.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xl font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''} Rs. {Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            )) : <p className="text-center text-slate-400 italic font-medium py-10">No financial history yet.</p>}
          </div>
        </div>

        {/* ACTIVE INVENTORY SECTION */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 mb-10">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-8">
            <ShoppingBag className="text-blue-600" /> Your Active Inventory
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProducts.length > 0 ? myProducts.map((product: any) => (
              <div key={product.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                <div className="h-40 bg-white rounded-2xl mb-4 overflow-hidden border border-slate-100">
                    {product.image_url ? (
                        <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48}/></div>
                    )}
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-1">{product.name}</h4>
                <div className="flex justify-between items-end border-t border-slate-200 pt-4 mt-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</span>
                    <p className="font-black text-blue-700">Rs. {product.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</span>
                    <p className="font-bold text-slate-600">{product.stock} units</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-center text-slate-400 py-10 col-span-full">No products found.</p>}
          </div>
        </div>

        {/* RECENT SALES ACTIVITY */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-8">
            <Clock className="text-amber-500" /> Recent Sales Activity
          </h3>
          <div className="space-y-4">
            {recentOrders.length > 0 ? recentOrders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center gap-5">
                  <div className="bg-white p-4 rounded-2xl shadow-sm text-blue-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 uppercase text-xs">Sale Item #{order.id}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Product ID: {order.product_id} • Qty: {order.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-2xl">Rs. {order.price.toLocaleString()}</p>
                  <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">COD Confirmed</span>
                </div>
              </div>
            )) : <p className="py-20 text-center text-slate-300">Waiting for your first order...</p>}
          </div>
        </div>

        {/* ADD PRODUCT MODAL WITH IMAGE UPLOAD */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
                <X size={28} />
              </button>
              <h2 className="text-3xl font-black mb-2 text-slate-900">List New Item</h2>
              
              <form onSubmit={handleAddProduct} className="space-y-5 mt-8">
                {/* CLOUDINARY UPLOAD SECTION */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Product Photo</label>
                  <CldUploadWidget 
                    uploadPreset="marketplace_preset" // ⚠️ IMPORTANT: Change this to your actual preset name
                    onSuccess={(result: any) => {
                      setProductForm({ ...productForm, image_url: result.info.secure_url });
                      alert("Photo Uploaded Successfully!");
                    }}
                  >
                    {({ open }) => (
                      <button 
                        type="button" 
                        onClick={() => open()}
                        className="w-full border-2 border-dashed border-slate-200 p-6 rounded-3xl text-slate-400 hover:border-blue-400 hover:text-blue-600 transition flex flex-col items-center gap-2"
                      >
                        {productForm.image_url ? (
                           <div className="flex items-center gap-2 text-green-600 font-bold">
                               <CheckCircle2 size={20}/> Photo Ready
                           </div>
                        ) : (
                           <>
                               <ImageIcon size={32} className="opacity-40" />
                               <span className="font-bold text-sm">Upload Item Photo</span>
                           </>
                        )}
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Item Name</label>
                  <input type="text" className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500" required
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Price (Rs.)</label>
                        <input type="number" className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500" required
                            onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Initial Stock</label>
                        <input type="number" className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500" required
                            onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})} />
                    </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                  <textarea className="w-full border-2 border-slate-100 p-4 rounded-2xl h-32 outline-none focus:border-blue-500" required
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-200">
                  Post to Marketplace
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}