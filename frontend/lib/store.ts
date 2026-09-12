import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- AUTHENTICATION STORE ---
interface AuthState {
  user: any | null;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        set({ user: null, token: null });
        // Clear local storage manually if needed
        localStorage.removeItem('auth-storage');
      },
    }),
    { name: 'auth-storage' }
  )
);

// --- SHOPPING CART STORE ---
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (product) => set((state) => {
        // Check if item already exists in cart
        const existingItem = state.cart.find(item => item.id === product.id);
        
        if (existingItem) {
          // If it exists, increase quantity
          return {
            cart: state.cart.map(item =>
              item.id === product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            )
          };
        }
        // If new, add to cart with quantity 1
        return { 
          cart: [...state.cart, { 
            id: product.id, 
            name: product.name, 
            price: product.price, 
            quantity: 1 
          }] 
        };
      }),
      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter(item => item.id !== id)
      })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: 'cart-storage' }
  )
);