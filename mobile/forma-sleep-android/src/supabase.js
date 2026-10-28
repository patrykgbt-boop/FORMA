import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import {createClient} from '@supabase/supabase-js';
// Public client configuration. Fallback also works when EAS Update uses an empty production environment.
// RLS in Supabase must protect user data; a publishable key is not an authentication secret.
const url=process.env.EXPO_PUBLIC_SUPABASE_URL||'https://ymemohuafzogbhgggcvm.supabase.co';
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_-3RrLnYXbVyGL7QeKgsEwg_ynhEAi7f';
if(!url||!key)throw new Error('Brak pliku .env (EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).');
export const supabase=createClient(url,key,{auth:{storage:localStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}});
