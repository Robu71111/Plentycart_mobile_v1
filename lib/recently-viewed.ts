import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'plentycart_recently_viewed';
const MAX = 10;

export type RecentProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export async function addRecentlyViewed(product: RecentProduct): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const list: RecentProduct[] = raw ? JSON.parse(raw) : [];
  const deduped = list.filter(p => p.id !== product.id);
  const next = [product, ...deduped].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function getRecentlyViewed(): Promise<RecentProduct[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearRecentlyViewed(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
