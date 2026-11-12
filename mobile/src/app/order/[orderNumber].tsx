import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getOrder, type Order } from '../../services/api';
import { Loading, Message, Screen, Title, money, colors } from '../../components/ui';
export default function OrderDetail() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const { session } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!session) return; void getOrder(session.access_token, orderNumber).then(setOrder).catch(e => setError(e instanceof Error ? e.message : 'Unable to load order.')).finally(() => setLoading(false)); }, [session, orderNumber]);
  if (loading) return <Loading />;
  if (error || !order) return <Screen><Message error>{error || 'Order not found.'}</Message></Screen>;
  return <Screen><Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>ORDER DETAILS</Text><Title>{order.orderNumber}</Title><View style={{ padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white }}><Text style={{ color: colors.muted, fontSize: 11 }}>Order status: {order.status}</Text><Text style={{ marginTop: 5, color: colors.muted, fontSize: 11 }}>Payment status: {order.paymentStatus}</Text><Text style={{ marginTop: 5, color: colors.muted, fontSize: 11 }}>Placed: {new Date(order.createdAt).toLocaleString()}</Text><Text style={{ marginTop: 10, color: colors.darkGreen, fontSize: 17, fontWeight: '800' }}>{money(order.totalAmount)}</Text></View><Text style={{ marginTop: 19, marginBottom: 4, color: colors.ink, fontSize: 14, fontWeight: '800' }}>Items</Text>{order.items?.map((item, index) => <View key={index} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.line }}><Text style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>{item.name}</Text><Text style={{ marginTop: 4, color: colors.muted, fontSize: 11 }}>{item.quantity} × {money(item.unitPrice)} · {money(item.total)}</Text></View>)}</Screen>;
}
