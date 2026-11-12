import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { getProducts, type Product } from '../../services/api';
import { Loading, Message, ProductCard, colors } from '../../components/ui';


export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(false);
  const router = useRouter();
  const shortcuts = Array.from(new Map(products.filter(p => p.category).map(p => [p.category!.slug, p.category!])).values()).slice(0, 4).map((category, index) => ({ label: category.name, slug: category.slug, color: ['#3773bb', '#7658aa', '#ce7b31', '#3f936e'][index], glyph: category.name.charAt(0).toUpperCase() }));
  const load = async () => {
    setError('');
    try { setProducts((await getProducts()).products); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load products.'); }
    finally { setLoading(false); setRefresh(false); }
  };
  useEffect(() => { void load(); }, []);
  const openShop = (category?: string) => router.push({ pathname: '/shop', params: category ? { category } : {} });

  return <ScrollView style={{ flex: 1, backgroundColor: colors.warm }} contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); void load(); }} tintColor={colors.green} />}>
    <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 }}>
        <View style={{ width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green }}><Text style={{ color: colors.white, fontSize: 17, fontWeight: '800' }}>M</Text></View>
        <View><Text style={{ color: colors.ink, fontSize: 15, fontWeight: '800', letterSpacing: -0.4 }}>majidadi</Text><Text style={{ color: '#8d948e', fontSize: 7, fontWeight: '700', letterSpacing: 1.1 }}>GENERAL SERVICES</Text></View>
      </View>
      <View style={{ overflow: 'hidden', minHeight: 190, flexDirection: 'row', borderRadius: 7, backgroundColor: '#eaf2ed' }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 19, paddingLeft: 16, paddingRight: 6 }}>
          <Text style={{ color: colors.green, fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }}>EVERYDAY FINDS, MADE EASY</Text>
          <Text style={{ marginTop: 9, color: '#17352f', fontSize: 24, lineHeight: 28, fontWeight: '800', letterSpacing: -0.8 }}>Good things{ '\n' }for your <Text style={{ color: colors.amber }}>everyday.</Text></Text>
          <Text style={{ marginTop: 7, color: '#65766d', fontSize: 11, lineHeight: 16 }}>Phones, books, stationery and more from one trusted shop.</Text>
          <Text onPress={() => openShop()} style={{ alignSelf: 'flex-start', marginTop: 13, paddingHorizontal: 13, paddingVertical: 9, overflow: 'hidden', borderRadius: 4, color: colors.white, backgroundColor: colors.darkGreen, fontSize: 11, fontWeight: '700' }}>Explore the shop  ›</Text>
        </View>
        <View style={{ width: 97, alignItems: 'center', justifyContent: 'center', marginRight: 5 }}>
          <View style={{ position: 'absolute', width: 88, height: 88, borderRadius: 44, backgroundColor: '#d3e7da' }} />
          <View style={{ width: 51, height: 105, padding: 4, transform: [{ rotate: '8deg' }], borderRadius: 11, borderWidth: 3, borderColor: '#1a2828', backgroundColor: '#203b38' }}>
            <View style={{ flex: 1, justifyContent: 'flex-end', padding: 6, borderRadius: 7, backgroundColor: '#315a4d' }}><Text style={{ color: '#bedacb', fontSize: 6 }}>MAJIDADI</Text><Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>SHOP</Text></View>
          </View>
          <View style={{ position: 'absolute', right: 0, bottom: 15, paddingHorizontal: 7, paddingVertical: 6, borderWidth: 1, borderColor: '#d8e6da', borderRadius: 5, backgroundColor: colors.white }}><Text style={{ color: colors.green, fontSize: 8, fontWeight: '700' }}>Shop with ease</Text></View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}><View><Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }}>BROWSE BY CATEGORY</Text><Text style={{ marginTop: 5, color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 }}>Find your everyday</Text></View><Text onPress={() => openShop()} style={{ color: colors.green, fontSize: 11, fontWeight: '700' }}>Shop all ›</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          {shortcuts.map(item => <Text key={item.label} onPress={() => openShop(item.slug)} style={{ width: '48%', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 11, borderWidth: 1, borderColor: '#edeae3', borderRadius: 6, color: colors.ink, backgroundColor: colors.white, fontSize: 11, fontWeight: '700' }}><Text style={{ color: item.color, fontWeight: '800' }}>{item.glyph}   </Text>{item.label}<Text style={{ color: '#99aaa0' }}>     ›</Text></Text>)}
        </View>
      </View>

      <View style={{ marginTop: 25 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 13 }}><View><Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }}>PICKED FOR YOU</Text><Text style={{ marginTop: 5, color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 }}>Featured products</Text></View><Text onPress={() => openShop()} style={{ color: colors.green, fontSize: 11, fontWeight: '700' }}>View all ›</Text></View>
        {loading ? <Loading /> : error ? <Message error>{error}</Message> : products.length === 0 ? <Message>New products are coming soon.</Message> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} />)}</View>}
      </View>
      <View style={{ marginTop: 5, padding: 15, borderRadius: 6, backgroundColor: colors.darkGreen }}><Text style={{ color: '#b7d7c3', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>THE MAJIDADI PROMISE</Text><Text style={{ marginTop: 6, color: colors.white, fontSize: 14, fontWeight: '700' }}>Useful finds. A simpler way to shop.</Text><Text style={{ marginTop: 4, color: '#afc4b7', fontSize: 11, lineHeight: 16 }}>Browse our selection and get help finding what you need at our Abuja shop.</Text></View>
    </View>
  </ScrollView>;
}



