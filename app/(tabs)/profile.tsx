import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
};

function MenuItem({ icon, label, onPress, right, destructive }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconCircle, destructive && styles.menuIconCircleDestructive]}>
        <Ionicons name={icon} size={18} color={destructive ? '#DC2626' : '#1A56DB'} />
      </View>
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>{label}</Text>
      {right ?? <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const initial = (user?.name?.[0] ?? 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? 'Guest'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/profile/edit' as never)}
          >
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="receipt-outline"
            label="My Orders"
            onPress={() => router.push('/(tabs)/orders' as never)}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="location-outline"
            label="Saved Addresses"
            onPress={() => router.push('/profile/addresses' as never)}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="card-outline"
            label="Payment Methods"
            onPress={() => router.push('/profile/payment-methods' as never)}
          />
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/profile/notifications' as never)}
          />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => router.push('/profile/help' as never)}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="information-circle-outline"
            label="About Plentycart"
            onPress={() => router.push('/profile/about' as never)}
            right={<Text style={styles.versionText}>v1.0.0</Text>}
          />
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={signOut}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  userAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#1A56DB',
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  userEmail: { fontSize: 13, color: '#64748B' },
  editProfileBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  editProfileText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.6,
    paddingHorizontal: 4, marginTop: 8, marginBottom: 4,
  },
  menuGroup: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  menuIconCircle: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconCircleDestructive: { backgroundColor: '#FEF2F2' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1E293B' },
  menuLabelDestructive: { color: '#DC2626' },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 64 },
  versionText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA',
    borderRadius: 14, paddingVertical: 15, marginTop: 12,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
});
