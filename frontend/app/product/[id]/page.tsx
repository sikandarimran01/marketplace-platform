"use client"
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCartStore, useAuthStore } from '@/lib/store'; // Added useAuthStore for review checks
import { 
  ShoppingCart, ArrowLeft, ShieldCheck, Truck, 
  RotateCcw, Package, Star, User, MessageSquare, Send 
} from 'lucide-react';
import Link from 'next/link';

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]); // NEW: Reviews list
  const [loading, setLoading] = useState(true);
  
  // NEW: Form State for a new review
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchProductAndReviews = async () => {
    try {
      const [prodRes, reviewsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/reviews`)
      ]);
      setProduct(prodRes.data);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error("Error fetching details:", err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductAndReviews(); }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
        alert("Please login to leave a review.");
        return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      setReviewForm({ rating: 5, comment: "" }); // Reset
      fetchProductAndReviews(); // Refresh list
      alert("🎉 Thank you for your feedback!");
    } catch (err) {
      alert("Failed to post review. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-300 font-black text-2xl uppercase tracking-widest">Loading...</div>
    </div>
  );
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="p-6 border-b flex items-center justify-between px-10">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold">
            <ArrowLeft size={20}/> Back to Market
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          
          {/* LEFT: IMAGE SECTION */}
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-100 aspect-square flex items-center justify-center relative group">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <Package size={120} className="text-slate-200" />
              )}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest text-blue-600 shadow-sm">
                Official Listing
              </div>
            </div>
          </div>

          {/* RIGHT: CONTENT SECTION */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    In Stock: {product.stock} units
                </span>
                {/* Visual Average Star Display (Static Placeholder) */}
                <div className="flex text-amber-400 ml-2">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
            </div>

            <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
                {product.name}
            </h1>
            
            <p className="text-slate-500 text-xl leading-relaxed mb-10 font-medium max-w-xl">
                {product.description || "No detailed description provided for this item."}
            </p>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">Market Price</span>
                <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
                    <span className="text-6xl font-black text-blue-700 tracking-tighter">Rs. {product.price.toLocaleString()}</span>
                    <button 
                        onClick={() => {
                            addToCart(product);
                            alert(`${product.name} added to cart!`);
                        }}
                        className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                    >
                        <ShoppingCart /> Add to Cart
                    </button>
                </div>
            </div>

            {/* TRUST BADGES */}
            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-10">
                <div className="flex flex-col items-center text-center gap-2">
                    <ShieldCheck className="text-green-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Buyer Protected</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <Truck className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Verified Seller</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                    <RotateCcw className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400">COD Available</span>
                </div>
            </div>
          </div>
        </div>

        {/* --- NEW: RATINGS & REVIEWS SECTION --- */}
        <section className="border-t border-slate-100 pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                
                {/* LEFT: LEAVE A REVIEW FORM */}
                <div className="lg:col-span-1">
                    <h3 className="text-3xl font-black text-slate-900 mb-2">Customer Review</h3>
                    <p className="text-slate-500 font-medium mb-8">Share your experience with other buyers.</p>
                    
                    <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Your Rating</label>
                            <div className="flex justify-center gap-2">
                                {[1,2,3,4,5].map((star) => (
                                    <button 
                                        key={star} type="button"
                                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                                        className={`transition-all transform hover:scale-110 ${reviewForm.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                                    >
                                        <Star size={32} fill={reviewForm.rating >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Comment</label>
                            <textarea 
                                className="w-full bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 outline-none transition-all h-32 text-slate-700 font-medium"
                                placeholder="What did you like or dislike?"
                                required
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                            ></textarea>
                        </div>

                        <button 
                            type="submit"
                            disabled={submitting || !token}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Posting..." : <><Send size={18}/> Post Review</>}
                        </button>
                        {!token && <p className="text-[10px] text-center text-red-400 font-bold uppercase mt-2">Login Required to Review</p>}
                    </form>
                </div>

                {/* RIGHT: REVIEWS LIST */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <MessageSquare className="text-blue-600" /> Reviews ({reviews.length})
                        </h3>
                    </div>

                    <div className="space-y-6">
                        {reviews.length > 0 ? reviews.map((rev) => (
                            <div key={rev.id} className="p-8 border border-slate-100 rounded-[2.5rem] bg-white hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 leading-none mb-1">{rev.user_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(rev.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-600 font-medium leading-relaxed italic">
                                    "{rev.comment}"
                                </p>
                            </div>
                        )) : (
                            <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold italic">No reviews yet. Be the first to tell us what you think!</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </section>
      </main>
    </div>
  );
}