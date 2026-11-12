import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { initializePayment } from '../services/api';
import { Button, Field, Message, Screen, Title, money, colors } from '../components/ui';

WebBrowser.maybeCompleteAuthSession();
type Method = 'delivery' | 'pickup';

export default function Checkout() {
  const { items, subtotal, loading: cartLoading, error: cartError } = useCart();
  const { user, session } = useAuth();
  const router = useRouter();
  const [fullName, setName] = useState(String(user?.user_metadata.full_name || user?.user_metadata.name || ''));
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [method, setMethod] = useState<Method>('delivery');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (busy) return;
    const digits = phone.replace(/\D/g, '');
    if (!fullName.trim() || !email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || digits.length < 7 || digits.length > 15) { setError('Enter a name, valid email address, and phone number.'); return; }
    if (method === 'delivery' && (!address.trim() || !city.trim() || !state.trim())) { setError('Enter your delivery address, city, and state.'); return; }
    if (!items.length) { setError('Your cart is empty.'); return; }
    setBusy(true); setError('');
    try {
      const payment = await initializePayment({ customer_name: fullName.trim(), customer_email: email.trim(), customer_phone: phone.trim(), delivery_method: method, ...(method === 'delivery' ? { delivery_address: address.trim(), delivery_city: city.trim(), delivery_state: state.trim() } : {}), items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })), mobile_app: true }, session?.access_token);
      const returnUrl = Linking.createURL('payment/callback');
      const result = await WebBrowser.openAuthSessionAsync(payment.authorizationUrl, returnUrl);
      if (result.type === 'success') {
        const url = new URL(result.url);
        const reference = url.searchParams.get('reference') || url.searchParams.get('trxref');
        if (reference) router.replace({ pathname: '/payment/callback', params: { reference, orderNumber: payment.orderNumber, total: String(subtotal) } });
        else router.replace({ pathname: '/payment/callback', params: { error: 'Payment returned without a reference.' } });
      } else if (result.type === 'cancel') router.replace({ pathname: '/payment/callback', params: { cancelled: '1' } });
      else setError('Payment window closed. If you completed payment, check My Orders or track your order before trying again.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to start payment. Please try again.'); }
    finally { setBusy(false); }
  };

  if (cartLoading) return <Screen><Message>Loading your cart…</Message></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.warm }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}><Screen>
      <Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>SECURE CHECKOUT</Text><Title>Checkout</Title>
      {cartError ? <Message error>{cartError}</Message> : null}
      {!items.length ? <><Message>Your cart is empty.</Message><Button label="Back to shop" onPress={() => router.replace('/shop')} /></> : <>
        <Text style={{ marginBottom: 10, color: colors.ink, fontSize: 14, fontWeight: '800' }}>Customer information</Text>
        <Field label="Full name" value={fullName} onChangeText={setName} autoComplete="name" />
        <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={{ marginTop: 3, marginBottom: 9, color: colors.ink, fontSize: 14, fontWeight: '800' }}>Fulfillment</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 9 }}>
          {(['delivery', 'pickup'] as const).map(option => <Pressable key={option} onPress={() => setMethod(option)} style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: method === option ? colors.green : colors.line, borderRadius: 4, backgroundColor: method === option ? colors.pale : colors.white }}><Text style={{ color: method === option ? colors.green : colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>{option}</Text></Pressable>)}
        </View>
        {method === 'delivery' ? <><Field label="Delivery address" value={address} onChangeText={setAddress} /><View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Field label="City" value={city} onChangeText={setCity} /></View><View style={{ flex: 1 }}><Field label="State" value={state} onChangeText={setState} /></View></View></> : <View style={{ marginBottom: 12, padding: 11, borderRadius: 4, backgroundColor: colors.pale }}><Message>Collect from Shop No. 2, Opposite Sunset, Along Abaji Area Council, FCT Abuja.</Message></View>}
        <View style={{ marginTop: 4, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 6, backgroundColor: colors.white }}>
          <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>Order summary</Text>
          {items.map(i => <View key={i.product.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 9 }}><Text numberOfLines={1} style={{ flex: 1, color: colors.muted, fontSize: 11 }}>{i.quantity} × {i.product.name}</Text><Text style={{ color: colors.ink, fontSize: 11, fontWeight: '600' }}>{money(Number(i.product.price) * i.quantity)}</Text></View>)}
          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: colors.line }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}><Text style={{ color: colors.muted, fontSize: 11 }}>Subtotal</Text><Text style={{ color: colors.ink, fontSize: 11 }}>{money(subtotal)}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}><Text style={{ color: colors.muted, fontSize: 11 }}>Delivery / transport</Text><Text style={{ color: colors.ink, fontSize: 11 }}>{money(0)}</Text></View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>Total</Text><Text style={{ color: colors.darkGreen, fontSize: 15, fontWeight: '800' }}>{money(subtotal)}</Text></View></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }}><Text style={{ color: colors.green, fontSize: 13 }}>●</Text><Text style={{ color: colors.muted, fontSize: 11 }}>Payment secured by Paystack</Text></View>
        {error ? <Message error>{error}</Message> : null}
        <Button label={busy ? 'Opening Paystack…' : 'Pay with Paystack'} disabled={busy} onPress={() => void submit()} />
      </>}
    </Screen></ScrollView>
  </KeyboardAvoidingView>;
}
