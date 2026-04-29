import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CartItem = { id: string; name: string; price: number; quantity: number; image?: string };
type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);
const CART_KEY = '@plentycart/cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((data) => {
      if (data) setItems(JSON.parse(data));
    });
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const next = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];
      AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeItem = (id: string) => persist(items.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    persist(items.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => persist([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
