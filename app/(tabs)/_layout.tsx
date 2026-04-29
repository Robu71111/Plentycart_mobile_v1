import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors } from '../../constants/theme';
import { useCart } from '../../lib/cart';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  focused,
  name,
  outlineName,
}: {
  focused: boolean;
  name: IconName;
  outlineName: IconName;
}) {
  return (
    <Ionicons
      name={focused ? name : outlineName}
      size={24}
      color={focused ? Colors.primary : Colors.text.gray}
    />
  );
}

export default function TabsLayout() {
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.gray,
        tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.border },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" outlineName="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="search" outlineName="search-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#DC2626', color: '#fff', fontSize: 10 },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="cart" outlineName="cart-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="receipt" outlineName="receipt-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="person" outlineName="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
