import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { dbError } from '../utils/dbError.js';

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, icon')
    .eq('is_active', true)
    .order('id');
  if (error) throw dbError('listCategories', error, 'Could not load categories');
  return data;
}

/**
 * Report filters/creation take a category *slug* over the wire (rules.md §5: kebab-case
 * API surface); this resolves it to the internal id used by the DB layer.
 * @param {string} slug
 * @returns {Promise<number>}
 */
export async function getCategoryIdBySlug(slug) {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw dbError('getCategoryIdBySlug', error, 'Could not resolve category');
  if (!data) throw new AppError('VALIDATION_ERROR', 422, `Unknown category "${slug}"`);
  return data.id;
}
