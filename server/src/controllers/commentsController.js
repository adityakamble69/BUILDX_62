import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import { addComment, deleteOwnComment, adminDeleteComment } from '../services/commentService.js';

export async function postComment(req, res) {
  const { userId, role } = getAuthContext(req);
  await ensureProfile(userId);
  // Phase 8: admins post through this same citizen-facing route (there is no separate
  // admin comment endpoint, architecture.md §9) — flagging it here is what lets
  // CommentsSection.jsx's existing "Official" badge ever actually show up.
  const data = await addComment(req.params.id, userId, req.body.body, role === 'admin');
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
