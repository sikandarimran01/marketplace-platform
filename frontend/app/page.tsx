"use client"
import { useEffect, useState } from 'react';
import api from '../lib/api'; 
import { useAuthStore, useCartStore } from '../lib/store'; 
import { 
  ShoppingCart, Store, User, LogOut, Package, 
  Search, Heart, ChevronRight, Plus, MapPin, Globe, Menu, X, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuthStore(); 
  const { cart, addToCart } = useCartStore(); 
  const [mounted, setMounted] = useState(false);

  // --- GENERAL MARKETPLACE SLIDER LOGIC ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: "NEXT-GEN GADGETS",
      subtitle: "Electronics & Tech",
      bg: "bg-[#0F172A]", // Dark Navy for Tech
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80",
      buttonText: "Explore Tech →",
      isTech: true
    },
    {
      title: "SEASONAL FASHION",
      subtitle: "New Arrivals",
      bg: "bg-[#7C3AED]", // Purple for Fashion
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80",
      buttonText: "Shop Collection →"
    },
    {
        title: "HOME ESSENTIALS",
        subtitle: "Luxury Living",
        bg: "bg-[#059669]", // Green for Home
        image: "https://images.unsplash.com/photo-1513507766391-aa3a70359f4a?auto=format&fit=crop&q=80",
        buttonText: "View Decor →"
      }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setMounted(true);
    const delayDebounceFn = setTimeout(() => {
      api.get(`/products/?q=${searchQuery}`).then((res) => setProducts(res.data));
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]); 

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans">
      
      {/* 1. TOP UTILITY BAR (Onboarding & Trust) */}
      <div className="bg-[#0047AB] text-white text-[10px] md:text-[11px] py-2 px-10 flex justify-between items-center font-bold uppercase tracking-wider">
        <div className="flex gap-6">
          <Link href={user ? "/seller/dashboard" : "/signup"} className="hover:text-[#B3E52B] transition-colors flex items-center gap-1">
            <Store size={12}/> Open Your Store & Start Selling
          </Link>
          <span className="hidden md:block opacity-50 italic">World-Class Global Logistics</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[#B3E52B]">
                <ShieldCheck size={12} /> Secure Payments
            </div>
            <span className="cursor-pointer hover:text-blue-200">Customer Support</span>
        </div>
      </div>

      {/* 2. MAIN BRANDED HEADER */}
      <header className="bg-[#0052D4] text-white py-4 px-10 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex items-center gap-8">
          <Link href="/" className="text-3xl font-black italic tracking-tighter flex items-center gap-1 shrink-0">
            <ShoppingCart className="text-[#B3E52B]" fill="currentColor" size={28} /> Cestora
          </Link>

          <div className="flex-1 relative group max-w-3xl mx-auto">
            <input 
              type="text" placeholder="Search for products, stores or categories..." value={searchQuery}
              className="w-full bg-white text-slate-800 p-2.5 pl-6 pr-14 rounded-full outline-none font-medium shadow-inner text-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="absolute right-1 top-1 bg-[#0052D4] p-2 rounded-full hover:bg-blue-800 transition-all">
                <Search size={18} />
            </button>
          </div>

          <div className="flex items-center gap-8 shrink-0">
            <Link href="/checkout" className="relative cursor-pointer hover:text-[#B3E52B] transition-all">
              <ShoppingCart size={26} />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-[#B3E52B] text-[#0052D4] text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-[#0052D4] animate-bounce">{cart.length}</span>}
            </Link>

            {user ? (
               <div className="flex items-center gap-5 border-l border-white/10 pl-6 text-[11px] font-black uppercase tracking-tighter">
                   <Link href={user.role === 'seller' ? "/seller/dashboard" : "/orders"} className="hover:text-[#B3E52B]">
                       {user.role === 'seller' ? 'Seller Hub' : 'My Account'}
                   </Link>
                   <button onClick={logout} className="text-red-300 hover:text-white transition-colors"><LogOut size={20} /></button>
               </div>
            ) : (
                <Link href="/login" className="bg-white text-[#0052D4] px-8 py-2 rounded-full text-xs font-black hover:bg-[#B3E52B] transition-all shadow-xl uppercase">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SLIDER (Reduced Height Panoramic View) */}
      <section className="max-w-[1600px] mx-auto p-4 md:px-10 md:pt-6">
        <div className={`relative rounded-[2.5rem] h-[220px] md:h-[280px] overflow-hidden transition-all duration-700 ${slides[currentSlide].bg} shadow-2xl`}>
            
            <div className="h-full flex items-center px-10 md:px-24 relative z-10">
                <div className="max-w-xl space-y-2">
                    <p className="font-bold uppercase tracking-[0.3em] text-[10px] text-white opacity-60">
                        {slides[currentSlide].subtitle}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-white uppercase italic">
                        {slides[currentSlide].title}
                    </h1>
                    <div className="pt-4">
                        <button className="bg-white text-slate-900 px-10 py-3 rounded-full font-black text-[10px] uppercase hover:bg-[#B3E52B] hover:text-[#0052D4] transition-all active:scale-95 shadow-xl">
                            {slides[currentSlide].buttonText}
                        </button>
                    </div>
                </div>
            </div>

            {/* Slider Decoration Image */}
            <div className="absolute right-0 top-0 h-full w-2/3 flex justify-end opacity-40">
                <img src={slides[currentSlide].image} className="h-full w-full object-cover rounded-l-full" alt="banner" />
            </div>

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, i) => (
                    <button 
                        key={i} onClick={() => setCurrentSlide(i)}
                        className={`h-1.5 transition-all rounded-full ${currentSlide === i ? 'w-10 bg-white' : 'w-2 bg-white/30'}`}
                    />
                ))}
            </div>
        </div>
      </section>

      {/* 4. MAIN DISCOVERY GRID */}
      <main className="max-w-[1600px] mx-auto px-10 py-10">
        <div className="flex justify-between items-end mb-12">
            <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Featured items</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Trending across all departments</p>
            </div>
            <button className="bg-white border-2 border-slate-100 text-slate-900 px-6 py-2.5 rounded-full font-black text-[10px] uppercase shadow-sm flex items-center gap-1 hover:bg-slate-50 transition-all">
                Browse Full Catalog <ChevronRight size={14} />
            </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {products.map((product: any) => (
            <div key={product.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 group">
              <Link href={`/product/${product.id}`} className="block aspect-square rounded-[2rem] bg-slate-50 overflow-hidden mb-5 p-4 relative cursor-pointer">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={40}/></div>
                )}
                <Heart size={16} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors" />
              </Link>

              <div className="flex justify-between items-end px-1">
                <div className="space-y-0.5 overflow-hidden">
                  <p className="text-[#0052D4] font-black text-xl tracking-tighter">Rs. {product.price.toLocaleString()}</p>
                  <Link href={`/product/${product.id}`}>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase truncate hover:text-blue-600 transition-colors">{product.name}</h4>
                  </Link>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Store size={10} className="text-[#B3E52B]" /> Verified Merchant
                  </p>
                </div>
                <button 
                  onClick={() => { addToCart(product); alert(`Added to cart!`); }}
                  className="bg-[#0052D4] text-white p-3 rounded-full shadow-lg shadow-blue-50 hover:bg-[#B3E52B] hover:text-[#0052D4] transition-all active:scale-90"
                >
                  <Plus size={18} strokeWidth={4} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION: GENERAL CATEGORIES */}
        <section className="mt-24 border-t pt-16">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-12">Shop by department</h3>
            <div className="flex gap-10 overflow-x-auto pb-8 scrollbar-hide">
                {['Electronics', 'Fashion', 'Kitchen', 'Beauty', 'Health', 'Sports', 'Automotive', 'Collectibles'].map((cat, i) => (
                    <div key={i} className="flex-shrink-0 group cursor-pointer text-center space-y-4">
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center group-hover:border-[#0052D4] group-hover:-translate-y-2 transition-all duration-300">
                            <span className="text-[#0052D4] font-black text-2xl opacity-20 group-hover:opacity-100 uppercase">{cat[0]}{cat[1]}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900">{cat}</p>
                    </div>
                ))}
            </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-20 mt-32 text-white">
        <div className="max-w-[1600px] mx-auto px-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="text-4xl font-black italic tracking-tighter text-[#B3E52B]">Cestora</div>
                <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="hover:text-[#B3E52B] cursor-pointer">Support</span>
                    <span className="hover:text-[#B3E52B] cursor-pointer">Privacy</span>
                    <span className="hover:text-[#B3E52B] cursor-pointer">Merchant Terms</span>
                </div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">© 2026 Global Marketplace Platform</p>
            </div>
        </div>
      </footer>
    </div>
  );
}