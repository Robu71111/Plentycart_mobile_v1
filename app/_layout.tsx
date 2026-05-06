import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { CartProvider } from '../lib/cart';
import { CheckoutProvider } from '../lib/checkout';
import { initOrders } from '../lib/orders';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/login');
    } else if (user && inAuth) {
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => { initOrders(); }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <CheckoutProvider>
            <StatusBar style="dark" />
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="profile/index"
                  options={{ animation: 'slide_from_right', headerShown: false }}
                />
              </Stack>
            </AuthGuard>
          </CheckoutProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
