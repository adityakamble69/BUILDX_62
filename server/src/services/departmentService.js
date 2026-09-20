import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { dbError } from '../utils/dbError.js';

/**
 * @param {boolean} [activeOnly] The report form and admin "assign" dropdown only want
 *   active departments; the admin departments management page wants all of them so a
 *   deactivated one doesn't just disappear with no explanation.
 */
export async function listDepartments(activeOnly = false) {
  let query = supabase.from('departments').select('id, name, is_active').order('name');
  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw dbError('listDepartments', error, 'Could not load departments');
  return data;
}

/** @param {string} name */
export async function createDepartment(name) {
  const { data, error } = await supabase
    .from('departments')
    .insert({ name })
    .select('id, name, is_active')
    .single();
  if (error) {
    // Unique violation on departments.name (001_schema.sql).
    if (error.code === '23505') throw new AppError('CONFLICT', 409, `Department "${name}" already exists`);
    throw dbError('createDepartment', error, 'Could not create the department');
  }
  return data;
}

/**
 * @param {number} id
 * @param {{ name?: string, isActive?: boolean }} patch
 */
export async function updateDepartment(id, patch) {
  const updates = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.isActive !== undefined) updates.is_active = patch.isActive;

  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select('id, name, is_active')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw new AppError('CONFLICT', 409, `Department "${patch.name}" already exists`);
    throw dbError('updateDepartment', error, 'Could not update the department');
  }
  if (!data) throw new AppError('NOT_FOUND', 404, 'Department not found');
  return data;
}
