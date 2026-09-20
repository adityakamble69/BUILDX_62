import { listCategories } from '../services/categoryService.js';

export async function getCategories(_req, res) {
  const data = await listCategories();
  res.json({ data });
}
