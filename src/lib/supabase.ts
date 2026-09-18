import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (Boolean(url) !== Boolean(key)) throw new Error('Configura juntas NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
export const supabase = url && key ? createClient(url, key) : null;
export const isDemo = !supabase;
