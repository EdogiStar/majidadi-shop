import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { getProducts, type Product } from '../../services/api';
import { Field, Loading, Message, ProductCard, colors } from '../../components/ui';

export default function Shop() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.category || '');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const load = useCallback(async () => {
    setError('');
    try { setProducts((await getProducts({ search, category: category || undefined })).products); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load products.'); }
    finally { setLoading(false); setRefresh(false); }
  }, [search, category]);
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);
  const categories = useMemo(() => Array.from(new Map(products.filter(p => p.category).map(p => [p.category!.slug, p.category!])).entries()), [products]);
  const filters = [{ slug: '', name: 'All' }, ...categories.map(([, item]) => item)];
  return <View style={{ flex: 1, backgroundColor: colors.warm }}>
    <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 }}>
      <Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }}>MAJIDADI GENERAL SERVICES</Text>
      <Text style={{ marginTop: 5, color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 }}>Shop</Text>
      <Text style={{ marginTop: 3, marginBottom: 10, color: colors.muted, fontSize: 11 }}>Thoughtful essentials for work, home and play.</Text>
      <Field label="Search products" value={search} onChangeText={setSearch} placeholder="Try phones or books" returnKeyType="search" />
      <FlatList horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }} data={filters} keyExtractor={item => item.slug || 'all'} renderItem={({ item }) => <Pressable onPress={() => setCategory(item.slug)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: category === item.slug ? colors.green : colors.line, borderRadius: 4, backgroundColor: category === item.slug ? colors.green : colors.white }}><Text style={{ color: category === item.slug ? colors.white : colors.muted, fontSize: 10, fontWeight: '700' }}>{item.name}</Text></Pressable>} />
    </View>
    {loading ? <Loading /> : error ? <View style={{ padding: 18 }}><Message error>{error}</Message><Text onPress={() => void load()} style={{ color: colors.green, fontSize: 12, fontWeight: '700' }}>Tap to retry</Text></View> : <FlatList data={products} numColumns={2} keyExtractor={p => p.id} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 }} columnWrapperStyle={{ justifyContent: 'space-between' }} refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); void load(); }} tintColor={colors.green} />} renderItem={({ item }) => <ProductCard product={item} onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })} />} ListEmptyComponent={<View style={{ paddingTop: 25 }}><Message>No products matched your search.</Message></View>} />}
  </View>;
}
