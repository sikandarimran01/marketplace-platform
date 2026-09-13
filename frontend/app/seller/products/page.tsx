"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { 
  Package, PlusCircle, Upload, Download, Trash2, Edit3, 
  Search, ArrowLeft, CheckCircle2, Clock, XCircle, AlertTriangle, 
  Layers, X, Image as ImageIcon, LayoutDashboard, ShoppingCart,
   BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';

export default function SellerProductsPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States: 'all', 'approved', 'pending', 'draft', 'rejected', 'low_stock', 'out_of_stock'
  const [activeTab, setActiveTab] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/products/my-products';
      if (['approved', 'pending', 'draft', 'rejected'].includes(activeTab)) {
        url += `?status_filter=${activeTab}`;
      } else if (activeTab === 'low_stock' || activeTab === 'out_of_stock') {
        url += `?stock_filter=${activeTab}`;
      }
      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [token, activeTab]);

  // Handle Add / Edit
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        variants: form.variants.length > 0 ? JSON.stringify(form.variants) : null
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        alert("✅ Product Updated!");
      } else {
        await api.post('/products/add', payload);
        alert("🎉 Product Created!");
      }
      setIsAddModalOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      alert("Error saving product. Check your inputs.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this product permanently?")) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert("Failed to delete.");
      }
    }
  };

  const resetForm = () => {
    setForm({
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
  };

  // Bulk Upload CSV
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/products/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      setIsBulkModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert("Failed to process CSV file.");
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const res = await api.get('/products/export-csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'my_products_catalog.csv';
      link.click();
    } catch (err) {
      alert("Failed to export products.");
    }
  };

  // Variant helper
  const addVariant = () => {
    if (!newVariant.name) return;
    setForm({
      ...form,
      variants: [...form.variants, newVariant]
    });
    setNewVariant({ name: '', price: form.price, stock: 5 });
  };

  const removeVariant = (index: number) => {
    setForm({
      ...form,
      variants: form.variants.filter((_, i) => i !== index)
    });
  };

  // Filtered by Search input
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:block sticky top-0 h-screen">
        <h2 className="text-xl font-black mb-10 flex items-center gap-2 tracking-tighter">
          <Package className="text-blue-400" /> SellerHub
        </h2>
        <nav className="space-y-3">
          <Link href="/seller/dashboard" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <LayoutDashboard size={16}/> Dashboard
          </Link>
          <div className="flex items-center gap-3 bg-blue-600 p-3.5 rounded-2xl shadow-lg font-bold text-xs uppercase tracking-wider text-white">
            <Package size={16}/> Products (Active)
          </div>
          <Link href="/seller/inventory" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <BarChart3 size={16}/> Inventory Control
          </Link>
          <Link href="/seller/orders" className="flex items-center gap-3 text-slate-400 p-3 rounded-xl hover:text-white hover:bg-slate-800 transition font-bold text-xs">
            <ShoppingCart size={16}/> Orders
          </Link>
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Management</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Manage catalog, inventory statuses, variants, and bulk imports.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleExportCSV}
              className="bg-white border-2 border-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl font-black text-xs hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
            >
              <Download size={15} /> Export CSV
            </button>
            <button 
              onClick={() => setIsBulkModalOpen(true)}
              className="bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-2xl font-black text-xs hover:bg-purple-100 transition flex items-center gap-2"
            >
              <Upload size={15} /> Bulk Upload CSV
            </button>
            <button 
              onClick={() => { resetForm(); setEditingProduct(null); setIsAddModalOpen(true); }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-blue-700 shadow-xl shadow-blue-200 transition flex items-center gap-2 active:scale-95"
            >
              <PlusCircle size={16} /> Add Product
            </button>
          </div>
        </header>

        {/* --- TABS BAR --- */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide border-b border-slate-200">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'approved', label: 'Approved (Live)' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'draft', label: 'Drafts' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'low_stock', label: '⚠️ Low Stock (≤5)' },
            { id: 'out_of_stock', label: '🚨 Out of Stock (0)' }
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

        {/* Search & Filter Bar */}
        <div className="mb-6 max-w-md relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={18}/>
          <input 
            type="text"
            placeholder="Search by name or SKU..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-medium outline-none focus:border-blue-500"
          />
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-5 pl-8">Product</th>
                <th className="p-5">Category</th>
                <th className="p-5">Price</th>
                <th className="p-5">Stock</th>
                <th className="p-5">Status</th>
                <th className="p-5">Variants</th>
                <th className="p-5 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredProducts.map(p => {
                const variantsList = p.variants ? JSON.parse(p.variants) : [];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm truncate max-w-[200px]">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU: {p.sku || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-slate-600">{p.category || 'General'}</td>
                    <td className="p-5 font-black text-blue-700">Rs. {p.price.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        p.stock === 0 ? 'bg-red-100 text-red-700' :
                        p.stock <= 5 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} units`}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        p.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-200' :
                        p.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        p.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                        'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-5">
                      {variantsList.length > 0 ? (
                        <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 w-fit">
                          <Layers size={12}/> {variantsList.length} variants
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold">None</span>
                      )}
                    </td>
                    <td className="p-5 text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingProduct(p);
                            setForm({
                              name: p.name,
                              description: p.description || '',
                              category: p.category || 'General',
                              price: p.price,
                              stock: p.stock,
                              sku: p.sku || '',
                              status: p.status,
                              image_url: p.image_url || '',
                              variants: variantsList
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition"
                        >
                          <Edit3 size={15}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-slate-400 font-bold">
                    No products found under "{activeTab}". Click "+ Add Product" to create one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* --- MODAL 1: ADD / EDIT PRODUCT (WITH VARIANTS & STATUS) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-slate-400 mb-6">Manage product attributes, variants, and stock status.</p>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              
              {/* Photo */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Product Photo</label>
                <CldUploadWidget 
                  uploadPreset="marketplace_preset" 
                  onSuccess={(res: any) => setForm({ ...form, image_url: res.info.secure_url })}
                >
                  {({ open }) => (
                    <button 
                      type="button" 
                      onClick={() => open()}
                      className="w-full border-2 border-dashed border-slate-200 p-4 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      {form.image_url ? (
                        <span className="text-green-600 font-black flex items-center gap-1"><CheckCircle2 size={16}/> Photo Attached</span>
                      ) : (
                        <span className="flex items-center gap-1"><ImageIcon size={16}/> Upload Image</span>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
              </div>

              {/* Title & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Product Title</label>
                  <input type="text" className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500" required
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">SKU (Stock Keeping Unit)</label>
                  <input type="text" placeholder="e.g. ELEC-001" className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                    value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Category</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})}
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Listing Status</label>
                  <select 
                    value={form.status} 
                    onChange={e => setForm({...form, status: e.target.value})}
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
                    value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Stock Count</label>
                  <input type="number" className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500" required
                    value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Description</label>
                <textarea className="w-full border border-slate-200 p-3 rounded-xl text-xs font-medium outline-none focus:border-blue-500 h-20"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
              </div>

              {/* --- VARIANTS BUILDER SECTION --- */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Product Variants (Sizes / Colors)</label>
                
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Variant name (e.g. Size XL / Red)" value={newVariant.name}
                    onChange={e => setNewVariant({...newVariant, name: e.target.value})}
                    className="flex-1 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none" />
                  <input type="number" placeholder="Price" value={newVariant.price || ''}
                    onChange={e => setNewVariant({...newVariant, price: parseFloat(e.target.value)})}
                    className="w-24 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none" />
                  <input type="number" placeholder="Stock" value={newVariant.stock || ''}
                    onChange={e => setNewVariant({...newVariant, stock: parseInt(e.target.value)})}
                    className="w-20 border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none" />
                  <button type="button" onClick={addVariant} className="bg-slate-900 text-white px-4 rounded-xl text-xs font-black">
                    + Add
                  </button>
                </div>

                {form.variants.length > 0 && (
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl">
                    {form.variants.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-white p-2 px-3 rounded-xl border border-slate-100">
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

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-blue-700 shadow-xl shadow-blue-100 transition mt-4">
                {editingProduct ? "Save Changes" : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: BULK CSV UPLOAD --- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative">
            <button onClick={() => setIsBulkModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Bulk CSV Import</h2>
            <p className="text-xs text-slate-400 mb-6">Upload a CSV containing: name, price, stock, category, sku, image_url.</p>

            <div className="border-2 border-dashed border-slate-200 p-8 rounded-3xl text-center mb-6">
              <Upload size={36} className="mx-auto text-purple-600 mb-2" />
              <p className="text-xs font-bold text-slate-700 mb-1">Choose a .csv file to import</p>
              <input 
                type="file" 
                accept=".csv"
                onChange={handleBulkUpload}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer" 
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-[10px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Sample CSV Header:</p>
              <code className="block bg-white p-2 rounded border border-slate-200 font-mono text-[9px]">
                name,price,stock,category,sku,status
              </code>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}