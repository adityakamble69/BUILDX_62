import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import { addComment, deleteOwnComment } from '../services/commentService.js';

export async function postComment(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId);
  const data = await addComment(req.params.id, userId, req.body.body);
  res.status(201).json({ data });
}

export async function deleteComment(req, res) {
  const { userId } = getAuthContext(req);
  await deleteOwnComment(req.params.id, userId);
  res.status(204).send();
}
