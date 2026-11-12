import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getOrders, type Order } from '../../services/api';
import { Button, Loading, Message, Screen, Title, money, colors } from '../../components/ui';

export default function Orders() {
  const { user, session, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  useEffect(() => { if (authLoading) return; if (!session) { setLoading(false); return; } void getOrders(session.access_token).then(setOrders).catch(e => setError(e instanceof Error ? e.message : 'Unable to load orders.')).finally(() => setLoading(false)); }, [authLoading, session]);
  if (authLoading || loading) return <Loading />;
  return <ScrollView style={{ backgroundColor: colors.warm }}><Screen><Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>YOUR ACCOUNT</Text><Title>My Orders</Title>
    {!user ? <><Message>Log in to see orders placed from your account. Guest orders can be tracked with your order number and email.</Message><Button label="Log in" onPress={() => router.push('/auth/login')} /><Button label="Track a guest order" secondary onPress={() => router.push('/order-tracking')} /></> : error ? <Message error>{error}</Message> : orders.length === 0 ? <View style={{ padding: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white }}><Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>No orders yet</Text><Message>Your orders will appear here when you shop with your account.</Message><Button label="Start shopping" onPress={() => router.push('/shop')} /></View> : orders.map(order => <Pressable key={order.orderNumber} onPress={() => router.push({ pathname: '/order/[orderNumber]', params: { orderNumber: order.orderNumber } })} style={{ marginBottom: 10, padding: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>{order.orderNumber}</Text><Text style={{ color: colors.green, fontSize: 11, fontWeight: '800' }}>{money(order.totalAmount)}</Text></View><Text style={{ color: colors.muted, fontSize: 10, marginTop: 7 }}>{order.status} · Payment {order.paymentStatus}</Text><Text style={{ color: '#929c96', fontSize: 10, marginTop: 4 }}>{new Date(order.createdAt).toLocaleDateString()}</Text></Pressable>)}
  </Screen></ScrollView>;
}
