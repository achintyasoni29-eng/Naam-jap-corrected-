import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://gxgmipwfnkfyscehbytu.supabase.co';
const supabaseAnonKey = 'eyJhbGci...[YOUR_FULL_LONG_ANON_KEY]...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
