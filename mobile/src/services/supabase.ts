import 'react-native-url-polyfill/auto'; import { createClient } from '@supabase/supabase-js'; import * as SecureStore from 'expo-secure-store'; import { Platform } from 'react-native';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL?.trim(), anonKey=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
if(!url||!anonKey)console.warn('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable accounts.');
const secureStorage={getItem:(k:string)=>SecureStore.getItemAsync(k),setItem:(k:string,v:string)=>SecureStore.setItemAsync(k,v),removeItem:(k:string)=>SecureStore.deleteItemAsync(k)};
export const supabase=url&&anonKey?createClient(url,anonKey,{auth:{storage:Platform.OS==='web'?window.localStorage:secureStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:Platform.OS==='web'}}):null;
