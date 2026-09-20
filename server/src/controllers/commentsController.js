import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import { addComment, deleteOwnComment, adminDeleteComment } from '../services/commentService.js';

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

/** Admin moderation route — no ownership check (architecture.md `DELETE /admin/comments/:id`). */
export async function deleteAdminComment(req, res) {
  await adminDeleteComment(req.params.id);
  res.status(204).send();
}
