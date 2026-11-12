import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import { addCartItem, clearServerCart, getCart, removeCartItem, updateCartItem, type CartItem, type Product } from '../services/api';

const KEY = 'majidadi-guest-cart';
type CartValue = {
  items: CartItem[]; loading: boolean; error: string; count: number; subtotal: number;
  add: (product: Product, quantity?: number) => Promise<void>;
  change: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>; clear: () => Promise<void>;
};
const Context = createContext<CartValue | null>(null);

async function readGuestCart(): Promise<CartItem[]> {
  try {
    const value = Platform.OS === 'web' ? localStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return value ? JSON.parse(value) as CartItem[] : [];
  } catch { return []; }
}
async function writeGuestCart(items: CartItem[]) {
  try {
    const value = items.length ? JSON.stringify(items) : null;
    if (Platform.OS === 'web') { if (value) localStorage.setItem(KEY, value); else localStorage.removeItem(KEY); }
    else if (value) await SecureStore.setItemAsync(KEY, value);
    else await SecureStore.deleteItemAsync(KEY);
  } catch { /* Keep the in-memory cart usable. */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    void (async () => {
      setLoading(true); setError('');
      if (!session?.access_token) {
        const guest = await readGuestCart();
        if (active) setItems(guest);
      } else {
        try {
          let serverItems = (await getCart(session.access_token)).items;
          if (!active) return;
          let guestItems = await readGuestCart();
          for (const guestItem of [...guestItems]) {
            serverItems = (await addCartItem(session.access_token, guestItem.product.id, guestItem.quantity)).items;
            guestItems = guestItems.filter(item => item.product.id !== guestItem.product.id);
            await writeGuestCart(guestItems);
            if (active) setItems(serverItems);
          }
          if (active) setItems(serverItems);
        } catch (reason) {
          if (active) {
            setError(reason instanceof Error ? reason.message : 'Unable to load your cart.');
          }
        }
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [authLoading, session?.access_token, user?.id]);

  useEffect(() => {
    if (!session?.access_token && !authLoading && !loading) void writeGuestCart(items);
  }, [items, session?.access_token, authLoading, loading]);

  const value = useMemo<CartValue>(() => {
    const token = session?.access_token;
    const mutate = async (operation: () => Promise<{ items: CartItem[] }>) => {
      try { setItems((await operation()).items); setError(''); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update your cart.'); }
    };
    return {
      items, loading, error,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
      add: async (product, quantity = 1) => {
        const amount = Math.max(1, Math.floor(quantity));
        if (token) return mutate(() => addCartItem(token, product.id, amount));
        setItems(current => {
          const existing = current.find(item => item.product.id === product.id);
          return existing
            ? current.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + amount } : item)
            : [...current, { product, quantity: amount }];
        });
      },
      change: async (productId, quantity) => {
        const item = items.find(entry => entry.product.id === productId);
        if (!item) return;
        if (quantity <= 0) {
          if (token) return mutate(() => removeCartItem(token, productId));
          setItems(current => current.filter(entry => entry.product.id !== productId)); return;
        }
        const safeQuantity = Math.min(quantity, item.product.stock_quantity, 100);
        if (token) return mutate(() => updateCartItem(token, productId, safeQuantity));
        setItems(current => current.map(entry => entry.product.id === productId ? { ...entry, quantity: safeQuantity } : entry));
      },
      remove: async productId => {
        if (token) return mutate(() => removeCartItem(token, productId));
        setItems(current => current.filter(entry => entry.product.id !== productId));
      },
      clear: async () => {
        if (token) return mutate(() => clearServerCart(token));
        setItems([]);
      },
    };
  }, [items, loading, error, session?.access_token]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
