import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { getProduct, type Product } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Button, Loading, Message, Screen, money, colors } from '../../components/ui';

export default function ProductPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { add } = useCart();
  const router = useRouter();
  useEffect(() => { void getProduct(id).then(setProduct).catch(e => setError(e instanceof Error ? e.message : 'Unable to load product.')).finally(() => setLoading(false)); }, [id]);
  if (loading) return <Loading />;
  if (error || !product) return <Screen><Message error>{error || 'Product not found.'}</Message></Screen>;
  const available = product.stock_quantity > 0;
  return <ScrollView style={{ backgroundColor: colors.warm }} contentContainerStyle={{ paddingBottom: 30 }}><Screen>
    <Text onPress={() => router.back()} style={{ color: colors.green, fontSize: 11, fontWeight: '700', marginBottom: 14 }}>‹  Back to shop</Text>
    <View style={{ height: 270, borderRadius: 6, backgroundColor: '#eaf0f5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Image source={product.image_url ? { uri: product.image_url } : require('../../../assets/images/icon.png')} resizeMode="contain" style={{ width: '100%', height: '100%' }} /></View>
    {product.category?.name ? <Text style={{ marginTop: 17, color: '#929c96', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>{product.category.name}</Text> : null}
    <Text style={{ marginTop: 6, color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.6 }}>{product.name}</Text>
    <Text style={{ marginTop: 9, color: colors.darkGreen, fontSize: 19, fontWeight: '800' }}>{money(Number(product.price))}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: available ? '#2da174' : colors.red }} /><Text style={{ color: available ? colors.green : colors.red, fontSize: 11, fontWeight: '700' }}>{available ? `${product.stock_quantity} available` : 'Out of stock'}</Text></View>
    <Text style={{ marginTop: 15, color: colors.muted, fontSize: 13, lineHeight: 20 }}>{product.description || 'Product details are available from the shop.'}</Text>
    <View style={{ height: 1, marginTop: 18, backgroundColor: colors.line }} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 17 }}><Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>Quantity</Text><View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: colors.white }}><Pressable accessibilityLabel="Decrease quantity" onPress={() => setQuantity(n => Math.max(1, n - 1))} style={{ width: 37, height: 36, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.green, fontSize: 18 }}>−</Text></Pressable><Text style={{ width: 28, textAlign: 'center', color: colors.ink, fontSize: 12, fontWeight: '700' }}>{quantity}</Text><Pressable accessibilityLabel="Increase quantity" onPress={() => setQuantity(n => Math.min(product.stock_quantity, 100, n + 1))} disabled={quantity >= product.stock_quantity} style={{ width: 37, height: 36, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: quantity >= product.stock_quantity ? '#a4aaa4' : colors.green, fontSize: 17 }}>+</Text></Pressable></View></View>
    <Button label="Add to cart" disabled={!available} onPress={async () => { await add(product, quantity); router.push('/(tabs)/cart'); }} />
  </Screen></ScrollView>;
}
