import { createClient } from '@supabase/supabase-js';

// Estos datos los sacas de tu panel de Supabase:
// Settings -> API -> Project URL y Project API keys (anon public)
const supabaseUrl = 'https://lpohmrnblmlbkdwyumvt.supabase.co';
const supabaseAnonKey = 'sb_publishable_r9J6aU44GMOPon11xlMbyg_M2gdU1DP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);