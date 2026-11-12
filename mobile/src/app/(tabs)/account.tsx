import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Loading, Message, Screen, Title, colors } from '../../components/ui';

export default function Account() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  if (loading) return <Loading />;
  return <Screen><Text style={{ color: colors.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>MAJIDADI GENERAL SERVICES</Text><Title>Account</Title>
    {user ? <><View style={{ padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 5, backgroundColor: colors.white }}><Text style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>{user.user_metadata.full_name || user.user_metadata.name || 'Customer'}</Text><Text style={{ marginTop: 4, color: colors.muted, fontSize: 12 }}>{user.email}</Text></View><Button label="My Orders" onPress={() => router.push('/orders')} /><Button label="Track a guest order" secondary onPress={() => router.push('/order-tracking')} /><Button label="Log out" secondary onPress={async () => { await signOut(); router.replace('/(tabs)/account'); }} /></> : <><Message>Sign in to manage your account and view orders.</Message><Button label="Log in" onPress={() => router.push('/auth/login')} /><Button label="Create an account" secondary onPress={() => router.push('/auth/register')} /><Button label="Track a guest order" secondary onPress={() => router.push('/order-tracking')} /></>}
  </Screen>;
}
