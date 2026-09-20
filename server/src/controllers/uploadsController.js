import { createSignedUploads } from '../services/uploadService.js';
import { getAuthContext } from '../middleware/auth.js';

export async function postUploadSign(req, res) {
  const { userId } = getAuthContext(req);
  const data = await createSignedUploads(userId, req.body);
  res.json({ data });
}
