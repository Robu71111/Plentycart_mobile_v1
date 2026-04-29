import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import productsRaw from '../../data/products.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2;

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
      <Image
        source={{ uri: product.image }}
        style={styles.productImage}
        contentFit="cover"
        placeholder={{ color: '#F1F5F9' }}
        transition={200}
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

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const goToProduct = (id: string) => router.push(`/product/${id}` as never);

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
        /* No results */
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={44} color="#CBD5E1" />
          <Text style={styles.noResultsHeading}>No results for "{query}"</Text>
          <Text style={styles.noResultsSub}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            query.length === 0 ? (
              <Text style={styles.browseHeading}>Browse all products</Text>
            ) : (
              <Text style={styles.browseHeading}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
              </Text>
            )
          }
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => goToProduct(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

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

  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  noResultsHeading: { fontSize: 17, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  noResultsSub: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  browseHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    paddingBottom: 12,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
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
