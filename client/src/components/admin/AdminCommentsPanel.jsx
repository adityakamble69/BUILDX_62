'use client';

import { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { timeAgo } from '@/lib/utils/timeAgo';
import Button from '@/components/ui/Button';

/** Admin-only moderation for the comments already returned with a report. */
export default function AdminCommentsPanel({ initialComments = [] }) {
  const { request } = useApi();
  const { toast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [deletingId, setDeletingId] = useState(null);

  async function remove(comment) {
    setDeletingId(comment.id);
    try {
      await request(authPaths.adminDeleteComment(comment.id), { method: 'DELETE' });
      setComments((current) => current.filter((item) => item.id !== comment.id));
      toast('Comment removed', 'success');
    } catch (err) {
      toast(err.message || 'Could not remove comment', 'danger');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section aria-labelledby="admin-comments-heading">
      <h2 id="admin-comments-heading" className="flex items-center gap-2 font-semibold">
        <MessageSquare className="h-4 w-4" aria-hidden="true" /> Comments ({comments.length})
      </h2>
      {comments.length === 0 ? <p className="mt-3 text-sm text-ink-muted">No comments to moderate.</p> : <ul className="mt-3 flex flex-col gap-3">{comments.map((comment) => <li key={comment.id} className="rounded-md border border-border p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{comment.author?.display_name || 'Citizen'}</p><Button size="sm" variant="ghost" loading={deletingId === comment.id} onClick={() => remove(comment)}><Trash2 className="h-3.5 w-3.5" /> Remove</Button></div><p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{comment.body}</p><p className="mt-2 text-xs text-ink-subtle">{timeAgo(comment.created_at)}</p></li>)}</ul>}
    </section>
  );
}
