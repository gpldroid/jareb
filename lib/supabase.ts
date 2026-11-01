import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type FavoriteRow = {
  id?: string;
  email: string;
  item_ids: string[];
  created_at?: string;
  updated_at?: string;
};

export async function getFavorites(email: string): Promise<string[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('item_ids')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Array.isArray(data?.item_ids) ? data.item_ids : [];
}

export async function saveFavorites(email: string, itemIds: string[]) {
  if (!supabase) return;

  const { error } = await supabase
    .from('favorites')
    .upsert(
      { email, item_ids: itemIds },
      { onConflict: 'email' }
    );

  if (error) {
    throw error;
  }
}
