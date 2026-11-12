import { Tabs } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { colors } from '../../components/ui';
export default function TabLayout() {
  const { count } = useCart();
  return <Tabs screenOptions={{ headerTitleAlign: 'left', headerStyle: { backgroundColor: colors.warm }, headerTintColor: colors.ink, headerTitleStyle: { fontSize: 15, fontWeight: '700' }, tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line }, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: '#8d948e', tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 1 }, tabBarBadgeStyle: { backgroundColor: colors.amber, fontSize: 9 } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} /><Tabs.Screen name="shop" options={{ title: 'Shop', tabBarLabel: 'Shop' }} /><Tabs.Screen name="cart" options={{ title: 'Cart', tabBarLabel: 'Cart', tabBarBadge: count || undefined }} /><Tabs.Screen name="orders" options={{ title: 'My Orders', tabBarLabel: 'Orders' }} /><Tabs.Screen name="account" options={{ title: 'Account', tabBarLabel: 'Account' }} />
  </Tabs>;
}
