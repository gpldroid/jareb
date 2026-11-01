import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function saveFavorites(email: string, itemIds: string[]) {
  if (!supabase) return;

  const { error } = await supabase.from('favorites').upsert(
    {
      email,
      item_ids: itemIds
    },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('saveFavorites error:', error);
  }
}

export async function getFavorites(email: string) {
  if (!supabase) return [] as string[];

  const { data, error } = await supabase
    .from('favorites')
    .select('item_ids')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('getFavorites error:', error);
    return [] as string[];
  }

  try {
    return Array.isArray(data?.item_ids) ? (data.item_ids as string[]) : [];
  } catch {
    return [] as string[];
  }
}
