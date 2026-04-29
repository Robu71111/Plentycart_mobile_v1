import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import productsRaw from '../../data/products.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;

const CATEGORIES = ['All', 'Electronics', 'Skincare', 'Health & Wellness', 'Perfumes'] as const;
type Category = (typeof CATEGORIES)[number];

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price: number | null;
  category: string;
  image: string;
  stock: number;
  rating: number;
  review_count: number;
};

const products: Product[] = productsRaw as Product[];
const FEATURED_IDS = ['1', '6', '11', '16', '20'];
const featuredProducts = FEATURED_IDS.map((id) => products.find((p) => p.id === id)!);

function FeaturedCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: product.image }}
        style={styles.featuredImage}
        contentFit="cover"
        placeholder={{ color: '#F1F5F9' }}
        transition={300}
      />
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.featuredPrice}>${product.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: product.image }}
        style={styles.productImage}
        contentFit="cover"
        placeholder={{ color: '#F1F5F9' }}
        transition={300}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>${product.price}</Text>
          {product.compare_price != null && (
            <Text style={styles.comparePrice}>${product.compare_price}</Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.ratingValue}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({product.review_count})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [refreshing, setRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const initial = (user?.name?.[0] ?? 'U').toUpperCase();

  const filteredProducts = useMemo(
    () =>
      selectedCategory === 'All'
        ? products
        : products.filter((p) => p.category === selectedCategory),
    [selectedCategory]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const goToProduct = useCallback(
    (id: string) => router.push(`/product/${id}` as never),
    [router]
  );

  const listHeader = (
    <View>
      <View style={styles.greeting}>
        <Text style={styles.greetingName}>Hi, {firstName}</Text>
        <Text style={styles.greetingSubtitle}>What are you shopping for today?</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredContainer}
      >
        {featuredProducts.map((product) => (
          <FeaturedCard
            key={product.id}
            product={product}
            onPress={() => goToProduct(product.id)}
          />
        ))}
      </ScrollView>

      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'All' ? 'All Products' : selectedCategory}
        </Text>
        <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>Plentycart</Text>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/(tabs)/profile' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A56DB" />
        }
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => goToProduct(item.id)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  wordmark: { fontSize: 24, fontWeight: '800', color: '#1A56DB', letterSpacing: -0.5 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  greeting: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14 },
  greetingName: { fontSize: 26, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  greetingSubtitle: { fontSize: 15, color: '#64748B' },

  chipsContainer: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#1A56DB', borderColor: '#1A56DB' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#fff' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  sectionCount: { fontSize: 13, color: '#94A3B8' },

  featuredContainer: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', gap: 12 },
  featuredCard: {
    width: 160,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  featuredImage: { width: 160, height: 140, backgroundColor: '#F1F5F9' },
  featuredInfo: { padding: 10 },
  featuredName: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  featuredPrice: { fontSize: 15, fontWeight: '700', color: '#1A56DB' },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: { width: '100%', aspectRatio: 1, backgroundColor: '#F1F5F9' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 6, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  comparePrice: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starIcon: { fontSize: 12, color: '#F59E0B' },
  ratingValue: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  reviewCount: { fontSize: 11, color: '#94A3B8' },
});
