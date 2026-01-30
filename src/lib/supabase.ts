import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tkkbgoxwwrdkltcvwdrk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRra2Jnb3h3d3Jka2x0Y3Z3ZHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTM5ODAsImV4cCI6MjA4NTI4OTk4MH0.xGDrLMTL_tz4OAJw79Kj71skwis-MSPiawlvY7DQSmU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
