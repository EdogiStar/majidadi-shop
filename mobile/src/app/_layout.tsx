import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { colors } from '../components/ui';
export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><CartProvider><Stack screenOptions={{ headerStyle: { backgroundColor: colors.warm }, headerTintColor: colors.ink, headerTitleStyle: { fontSize: 14, fontWeight: '700' }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.warm } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="product/[id]" options={{ title: 'Product' }} /><Stack.Screen name="checkout" options={{ title: 'Checkout', presentation: 'modal' }} /><Stack.Screen name="payment/callback" options={{ title: 'Payment status', gestureEnabled: false }} /><Stack.Screen name="order/success" options={{ title: 'Order placed', gestureEnabled: false }} /><Stack.Screen name="order-tracking" options={{ title: 'Track an order' }} /><Stack.Screen name="auth/login" options={{ title: 'Log in', presentation: 'modal' }} /><Stack.Screen name="auth/register" options={{ title: 'Create account', presentation: 'modal' }} /><Stack.Screen name="order/[orderNumber]" options={{ title: 'Order details' }} /></Stack></CartProvider></AuthProvider></SafeAreaProvider>;
}
