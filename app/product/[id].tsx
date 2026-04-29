import { useState, useRef, useCallback, useMemo } from 'react';
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

// --- Deterministic review generator ---

function seededRand(seed: number) {
  const s = Math.sin(seed) * 43758.5453123;
  return s - Math.floor(s);
}

const REVIEWER_NAMES = [
  'Alex M.', 'Jordan K.', 'Taylor R.', 'Sam W.', 'Morgan B.',
  'Riley C.', 'Casey H.', 'Drew P.', 'Blake N.', 'Quinn D.',
  'Avery L.', 'Skyler T.', 'Reese A.', 'Finley J.', 'Parker S.',
];

const REVIEW_TEXTS: Record<string, string[]> = {
  Electronics: [
    'Works exactly as described. Setup was easy and the build quality feels premium.',
    'Excellent product! Battery life is impressive and performance is snappy.',
    'Great value for the price. Would definitely recommend to anyone looking for this category.',
    'Solid purchase. Packaging was pristine and it arrived earlier than expected.',
    'Really happy with this. The display quality is way better than I anticipated.',
    'Does everything I need it to do. Very satisfied with this purchase.',
    'Top notch quality. Feels well-made and the performance is excellent.',
  ],
  Skincare: [
    'My skin feels so much smoother after just two weeks of use. Love this!',
    'Finally found something that actually works for my skin type. Highly recommend.',
    'The texture is lightweight and absorbs quickly. No greasy residue at all.',
    'Noticed a real difference in hydration after a few days. Will repurchase.',
    'Great formula. Gentle on sensitive skin and the scent is subtle and pleasant.',
    'This has become a staple in my routine. My skin looks noticeably healthier.',
    'Worth every penny. The packaging is also really nice and hygienic.',
  ],
  'Health & Wellness': [
    'Really helpful for my daily routine. I feel more energetic throughout the day.',
    'Great quality supplement. Easy to take and no aftertaste whatsoever.',
    'Been using this for a month and I can genuinely feel the difference.',
    'Good value. The ingredients list is clean and transparent — I appreciate that.',
    'Excellent product for the price. Delivery was fast and packaging secure.',
    'Works as advertised. Happy with the results so far after consistent use.',
    'Really impressed by the quality. My go-to brand now for this category.',
  ],
  Perfumes: [
    'The sillage is incredible — I kept getting compliments all day long.',
    'Long-lasting and the dry-down is absolutely beautiful. Worth the price.',
    'Exactly as described. The opening notes are fresh and the base is warm and cozy.',
    'I was hesitant to buy blind but I\'m so glad I did. This is stunning.',
    'Great projection and the bottle looks gorgeous on my vanity.',
    'This scent is unique and sophisticated. Gets better as it dries down.',
    'Received several compliments within the first hour of wearing this. Obsessed.',
  ],
};

const FALLBACK_REVIEWS = [
  'Really pleased with this purchase. Great quality and fast delivery.',
  'Exceeded my expectations. Would buy from here again without hesitation.',
  'Good product, does what it says on the tin. Solid value.',
  'Happy with this. Packaging was careful and everything arrived in perfect condition.',
  'Highly recommend. Quality is top-notch for the price point.',
];

type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
};

function generateReviews(product: Product): Review[] {
  const pid = parseInt(product.id, 10);
  const count = 3 + Math.floor(seededRand(pid * 7) * 3); // 3–5
  const pool = REVIEW_TEXTS[product.category] ?? FALLBACK_REVIEWS;
  const usedTextIdx = new Set<number>();
  const usedNameIdx = new Set<number>();
  const reviews: Review[] = [];

  const now = new Date(2026, 3, 29); // deterministic "today"

  for (let i = 0; i < count; i++) {
    const r1 = seededRand(pid * 31 + i * 17);
    const r2 = seededRand(pid * 53 + i * 29);
    const r3 = seededRand(pid * 11 + i * 43);
    const r4 = seededRand(pid * 67 + i * 7);

    // Pick unique reviewer name
    let nameIdx = Math.floor(r1 * REVIEWER_NAMES.length);
    while (usedNameIdx.has(nameIdx)) nameIdx = (nameIdx + 1) % REVIEWER_NAMES.length;
    usedNameIdx.add(nameIdx);

    // Pick unique review text
    let textIdx = Math.floor(r2 * pool.length);
    while (usedTextIdx.has(textIdx)) textIdx = (textIdx + 1) % pool.length;
    usedTextIdx.add(textIdx);

    // Rating weighted around product.rating (±1 star, biased toward the actual rating)
    const base = Math.round(product.rating);
    const offset = r3 < 0.15 ? -1 : r3 > 0.85 ? 1 : 0;
    const rating = Math.min(5, Math.max(1, base + offset));

    // Date within last 6 months
    const daysAgo = Math.floor(r4 * 180) + 1;
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    reviews.push({
      id: `${product.id}-${i}`,
      author: REVIEWER_NAMES[nameIdx],
      rating,
      date,
      body: pool[textIdx],
    });
  }
  return reviews;
}

// --- End review generator ---

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
  const reviews = useMemo(() => (product ? generateReviews(product) : []), [product?.id]);

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

          {/* Reviews */}
          <View style={styles.divider} />
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionHeading}>Customer Reviews</Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillStar}>★</Text>
              <Text style={styles.ratingPillValue}>{product.rating.toFixed(1)}</Text>
            </View>
          </View>
          {reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{rev.author[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.reviewNameRow}>
                    <Text style={styles.reviewAuthor}>{rev.author}</Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Text key={s} style={{ fontSize: 12, color: s <= rev.rating ? '#F59E0B' : '#E2E8F0' }}>★</Text>
                    ))}
                    <Text style={styles.reviewDate}>{rev.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewBody}>{rev.body}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.viewAllReviews} activeOpacity={0.7}>
            <Text style={styles.viewAllReviewsText}>View all {product.review_count} reviews</Text>
            <Ionicons name="chevron-forward" size={15} color="#1A56DB" />
          </TouchableOpacity>

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

  reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF9C3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  ratingPillStar: { fontSize: 13, color: '#F59E0B' },
  ratingPillValue: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  reviewCard: { marginBottom: 16 },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 14, fontWeight: '700', color: '#1A56DB' },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, color: '#94A3B8', marginLeft: 6 },
  reviewBody: { fontSize: 13, color: '#475569', lineHeight: 20 },
  viewAllReviews: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 12, justifyContent: 'center',
  },
  viewAllReviewsText: { fontSize: 14, fontWeight: '600', color: '#1A56DB' },

  notFoundContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  backLink: { paddingVertical: 8, paddingHorizontal: 16 },
  backLinkText: { fontSize: 15, color: '#1A56DB', fontWeight: '600' },
});
