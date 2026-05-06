import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_KEY = 'plentycart_notifications';

type NotifSettings = {
  orderUpdates: boolean;
  promotions: boolean;
  newArrivals: boolean;
  priceDrops: boolean;
  appUpdates: boolean;
};

const DEFAULTS: NotifSettings = {
  orderUpdates: true,
  promotions: true,
  newArrivals: false,
  priceDrops: true,
  appUpdates: false,
};

const ITEMS: { key: keyof NotifSettings; label: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'orderUpdates', label: 'Order Updates', sub: 'Shipping, delivery, and tracking alerts', icon: 'cube-outline' },
  { key: 'promotions', label: 'Promotions & Deals', sub: 'Exclusive discounts and flash sales', icon: 'pricetag-outline' },
  { key: 'newArrivals', label: 'New Arrivals', sub: 'Be first to know about new products', icon: 'sparkles-outline' },
  { key: 'priceDrops', label: 'Price Drops', sub: 'Alerts when wishlist items go on sale', icon: 'trending-down-outline' },
  { key: 'appUpdates', label: 'App Updates', sub: 'News about features and improvements', icon: 'phone-portrait-outline' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotifSettings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  const toggle = async (key: keyof NotifSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionNote}>
          Choose which notifications you'd like to receive from Plentycart.
        </Text>

        <View style={styles.card}>
          {ITEMS.map((item, i) => (
            <View key={item.key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={18} color="#1A56DB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={() => toggle(item.key)}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={settings[item.key] ? '#1A56DB' : '#94A3B8'}
                />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footnote}>
          Notification preferences are saved locally on this device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  sectionNote: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  footnote: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
});
