import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useCart } from '../../context/CartContext';
import { Button, Loading, Message, Screen, Title, money, colors } from '../../components/ui';

export default function Cart() {
  const { items, loading, error, count, subtotal, change, remove, clear } = useCart();
  const router = useRouter();
  if (loading) return <Loading />;
  return <ScrollView style={{ backgroundColor: colors.warm }} contentContainerStyle={{ paddingBottom: 24 }}><Screen>
    <Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>YOUR SELECTION</Text><Title>Your cart</Title>
    {error ? <Message error>{error}</Message> : null}
    {items.length === 0 ? <View style={{ padding: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white }}><Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>Your cart is waiting</Text><Message>Find something useful in the shop and it will appear here.</Message><Button label="Browse products" onPress={() => router.push('/shop')} /></View> : <>
      <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 5 }}>{count} {count === 1 ? 'item' : 'items'}</Text>
      {items.map(i => <View key={i.product.id} style={{ flexDirection: 'row', gap: 11, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.line }}>
        <Image source={i.product.image_url ? { uri: i.product.image_url } : require('../../../assets/images/icon.png')} style={{ width: 76, height: 76, borderRadius: 5, backgroundColor: '#eaf0f5' }} resizeMode="contain" />
        <View style={{ flex: 1, justifyContent: 'center' }}><Text numberOfLines={2} style={{ color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: '700' }}>{i.product.name}</Text><Text style={{ color: colors.darkGreen, fontSize: 12, fontWeight: '800', marginTop: 4 }}>{money(Number(i.product.price))}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: colors.white }}><Pressable accessibilityLabel="Decrease quantity" onPress={() => void change(i.product.id, i.quantity - 1)} hitSlop={8} style={{ width: 30, height: 29, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.green, fontSize: 16 }}>−</Text></Pressable><Text style={{ minWidth: 24, color: colors.ink, textAlign: 'center', fontSize: 11, fontWeight: '700' }}>{i.quantity}</Text><Pressable accessibilityLabel="Increase quantity" onPress={() => void change(i.product.id, i.quantity + 1)} hitSlop={8} style={{ width: 30, height: 29, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.green, fontSize: 15 }}>+</Text></Pressable></View><Pressable onPress={() => void remove(i.product.id)} style={{ marginLeft: 12, padding: 5 }}><Text style={{ color: colors.muted, fontSize: 10 }}>Remove</Text></Pressable></View>
        </View><Text style={{ alignSelf: 'center', color: colors.ink, fontSize: 11, fontWeight: '700' }}>{money(Number(i.product.price) * i.quantity)}</Text>
      </View>)}
      <View style={{ marginTop: 18, padding: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white }}><Text style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>Order summary</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 }}><Text style={{ color: colors.muted, fontSize: 12 }}>Subtotal</Text><Text style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>{money(subtotal)}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}><Text style={{ color: colors.muted, fontSize: 12 }}>Delivery / transport</Text><Text style={{ color: colors.ink, fontSize: 12 }}>{money(0)}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.line }}><Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>Total</Text><Text style={{ color: colors.darkGreen, fontSize: 15, fontWeight: '800' }}>{money(subtotal)}</Text></View><Button label="Continue to checkout" onPress={() => router.push('/checkout')} /><Button label="Clear cart" secondary onPress={() => void clear()} /></View>
    </>}
  </Screen></ScrollView>;
}
