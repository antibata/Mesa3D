import { redirect } from 'next/navigation';
import { isDemo } from '@/lib/supabase';
export default function Home() { redirect(isDemo ? '/r/brasa' : '/acceso'); }
