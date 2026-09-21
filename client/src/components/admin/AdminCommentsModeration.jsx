'use client';

import { useState } from 'react';
import { MessageSquare, ShieldCheck, Trash2 } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { timeAgo } from '@/lib/utils/timeAgo';
import Badge from '@/components/ui/Badge';

/**
 * Read-only comment list with a moderation delete (architecture.md `DELETE /admin/comments/:id`).
 * No composer here — admins replying is the citizen `CommentsSection`'s job on the public
 * report page; this is purely the moderation view.
 * @param {{ comments: Array<object> }} props
 */
export default function AdminCommentsModeration({ comments: initialComments }) {
  const { request } = useApi();
  const { toast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(commentId) {
    setDeletingId(commentId);
    const previous = comments;
    setComments((current) => current.filter((c) => c.id !== commentId));
    try {
      await request(authPaths.adminDeleteComment(commentId), { method: 'DELETE' });
      toast('Comment removed', 'success');
    } catch (err) {
      setComments(previous);
      toast(err?.message || 'Could not remove the comment', 'danger');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section aria-labelledby="admin-comments-heading" className="flex flex-col gap-3">
      <h2 id="admin-comments-heading" className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5 text-ink-muted" aria-hidden="true" />
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted">No comments on this report.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{comment.author?.display_name || 'Citizen'}</p>
                {comment.is_admin && (
                  <Badge tone="info">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Official
                  </Badge>
                )}
                <span className="text-xs text-ink-subtle">{timeAgo(comment.created_at)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ink-muted hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-sm text-ink-muted">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
