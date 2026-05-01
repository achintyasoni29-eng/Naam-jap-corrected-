import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://gxgmipwfnkfyscehbytu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4Z21pcHdmbmtmeXNjZWhieXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzMyNzcsImV4cCI6MjA5MzA0OTI3N30.-Os01jNm-td3Mp0voS7ClResieQdi_30rXLXatRy5Lc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
