import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../lib/cart';
import productsRaw from '../../data/products.json';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.5;
const RELATED_WIDTH = 140;

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

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);

  const product = products.find((p) => p.id === id);
  const relatedProducts = product
    ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  const showToast = useCallback(() => {
    setToastVisible(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }, [toastAnim]);

  const handleAddToCart = useCallback(() => {
    if (!product || product.stock === 0) return;
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    showToast();
  }, [product, addItem, showToast]);

  if (!product) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stockStatus =
    product.stock === 0
      ? { label: 'Out of stock', color: '#DC2626' }
      : product.stock <= 10
        ? { label: `Only ${product.stock} left`, color: '#D97706' }
        : { label: 'In stock', color: '#16A34A' };

  const discountPct =
    product.compare_price != null
      ? Math.round((1 - product.price / product.compare_price) * 100)
      : null;

  return (
    <View style={styles.container}>
      {/* Toast banner */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              top: insets.top + 10,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>Added to cart!</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View>
          <Image
            source={{ uri: product.image }}
            style={styles.heroImage}
            contentFit="cover"
            placeholder={{ color: '#F1F5F9' }}
            transition={300}
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.categoryLabel}>{product.category}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {product.compare_price != null && (
              <Text style={styles.comparePrice}>${product.compare_price}</Text>
            )}
            {discountPct != null && (
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>{discountPct}% OFF</Text>
              </View>
            )}
          </View>

          {/* Star rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                style={[
                  styles.star,
                  { color: star <= Math.round(product.rating) ? '#F59E0B' : '#E2E8F0' },
                ]}
              >
                ★
              </Text>
            ))}
            <Text style={styles.ratingValue}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.review_count} reviews)</Text>
          </View>

          {/* Stock */}
          <View
            style={[styles.stockBadge, { backgroundColor: stockStatus.color + '18' }]}
          >
            <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {stockStatus.label}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Related Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedContainer}
              >
                {relatedProducts.map((rel) => (
                  <TouchableOpacity
                    key={rel.id}
                    style={styles.relatedCard}
                    onPress={() => router.push(`/product/${rel.id}` as never)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: rel.image }}
                      style={styles.relatedImage}
                      contentFit="cover"
                      placeholder={{ color: '#F1F5F9' }}
                      transition={200}
                    />
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedName} numberOfLines={2}>
                        {rel.name}
                      </Text>
                      <Text style={styles.relatedPrice}>${rel.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.addToCartBtn, product.stock === 0 && styles.addToCartDisabled]}
          onPress={handleAddToCart}
          activeOpacity={0.85}
          disabled={product.stock === 0}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addToCartText}>
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },

  heroImage: { width: SCREEN_WIDTH, height: HERO_HEIGHT, backgroundColor: '#F1F5F9' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  details: { padding: 20 },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A56DB',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 30,
    marginBottom: 14,
  },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  price: { fontSize: 26, fontWeight: '800', color: '#1E293B' },
  comparePrice: { fontSize: 17, color: '#94A3B8', textDecorationLine: 'line-through' },
  saleBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saleBadgeText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 14 },
  star: { fontSize: 16 },
  ratingValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginLeft: 4 },
  reviewCount: { fontSize: 13, color: '#64748B' },

  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  stockDot: { width: 7, height: 7, borderRadius: 4 },
  stockText: { fontSize: 13, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 22, color: '#475569' },

  relatedContainer: { flexDirection: 'row', gap: 12, paddingBottom: 4, paddingTop: 4 },
  relatedCard: {
    width: RELATED_WIDTH,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  relatedImage: { width: RELATED_WIDTH, height: 120, backgroundColor: '#F1F5F9' },
  relatedInfo: { padding: 8 },
  relatedName: { fontSize: 12, fontWeight: '600', color: '#1E293B', marginBottom: 4, lineHeight: 16 },
  relatedPrice: { fontSize: 14, fontWeight: '700', color: '#1A56DB' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  addToCartBtn: {
    backgroundColor: '#1A56DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  addToCartDisabled: { backgroundColor: '#94A3B8' },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  notFoundContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  backLink: { paddingVertical: 8, paddingHorizontal: 16 },
  backLinkText: { fontSize: 15, color: '#1A56DB', fontWeight: '600' },
});
