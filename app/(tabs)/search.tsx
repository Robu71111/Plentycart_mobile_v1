import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getRecentlyViewed,
  clearRecentlyViewed,
  type RecentProduct,
} from '../../lib/recently-viewed';
import productsRaw from '../../data/products.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;
const RECENT_CARD_WIDTH = 140;

type Product = {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  category: string;
  image: string;
  rating: number;
  review_count: number;
};

const products: Product[] = productsRaw as Product[];

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.image }}
          style={[styles.productImage, { borderRadius: 10 }]}
          contentFit="cover"
          placeholder={{ color: '#F1F5F9' }}
          transition={200}
        />
      </View>
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

function RecentCard({ product, onPress }: { product: RecentProduct; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recentCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.image }}
          style={[styles.recentImage, { borderRadius: 10 }]}
          contentFit="cover"
          placeholder={{ color: '#F1F5F9' }}
          transition={200}
        />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.recentPrice}>${product.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProduct[]>([]);

  const loadRecentlyViewed = useCallback(async () => {
    const list = await getRecentlyViewed();
    setRecentlyViewed(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecentlyViewed();
    }, [loadRecentlyViewed])
  );

  const handleClearRecent = useCallback(async () => {
    await clearRecentlyViewed();
    setRecentlyViewed([]);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const goToProduct = (id: string) => router.push(`/product/${id}` as never);

  const listHeader =
    query.length === 0 ? (
      <View>
        {recentlyViewed.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <TouchableOpacity onPress={handleClearRecent} hitSlop={8}>
                <Text style={styles.clearLink}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScrollContent}
            >
              {recentlyViewed.map((p) => (
                <RecentCard key={p.id} product={p} onPress={() => goToProduct(p.id)} />
              ))}
            </ScrollView>
          </View>
        )}
        <Text style={styles.browseHeading}>Browse all products</Text>
      </View>
    ) : (
      <Text style={styles.browseHeading}>
        {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
      </Text>
    );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products…"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length > 0 && filtered.length === 0 ? (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={44} color="#CBD5E1" />
          <Text style={styles.noResultsHeading}>No results for "{query}"</Text>
          <Text style={styles.noResultsSub}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.scroll}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => goToProduct(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  searchBarRow: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B', padding: 0 },

  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  noResultsHeading: { fontSize: 17, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  noResultsSub: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  columnWrapper: { gap: 12, marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  browseHeading: { fontSize: 16, fontWeight: '700', color: '#1E293B', paddingBottom: 12 },

  imageWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Recently viewed
  recentSection: { marginBottom: 20 },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clearLink: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  recentScrollContent: { gap: 10, paddingRight: 4 },
  recentCard: {
    width: RECENT_CARD_WIDTH,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  recentImage: { width: RECENT_CARD_WIDTH, height: 110, backgroundColor: '#F1F5F9' },
  recentInfo: { padding: 8 },
  recentName: { fontSize: 12, fontWeight: '600', color: '#1E293B', marginBottom: 3, lineHeight: 16 },
  recentPrice: { fontSize: 13, fontWeight: '700', color: '#1A56DB' },

  // Product grid
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
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  comparePrice: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starIcon: { fontSize: 12, color: '#F59E0B' },
  ratingValue: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  reviewCount: { fontSize: 11, color: '#94A3B8' },
});
