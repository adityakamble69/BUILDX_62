'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { MessageSquare, Trash2, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';
import { timeAgo } from '@/lib/utils/timeAgo';

const MAX_LENGTH = 500; // rules.md §11 — comment 1-500 chars (server enforces it too).

/**
 * Comment thread for one report. Seeded from `GET /reports/:id` (oldest first) and then
 * kept in local state: the API returns the created row, so there's no need to refetch the
 * whole report after posting.
 *
 * @param {{ reportId: string, initialComments?: Array<object> }} props
 */
export default function CommentsSection({ reportId, initialComments = [] }) {
  const { request, isSignedIn } = useApi();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleSubmit() {
    const text = body.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const { data } = await request(authPaths.reportComments(reportId), {
        method: 'POST',
        body: { body: text },
      });
      setComments((current) => [...current, data]);
      setBody('');
      toast('Comment posted', 'success');
    } catch (err) {
      toast(err?.message || 'Could not post your comment', 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    setDeletingId(commentId);
    const previous = comments;
    setComments((current) => current.filter((c) => c.id !== commentId));
    try {
      await request(authPaths.comment(commentId), { method: 'DELETE' });
      toast('Comment deleted', 'success');
    } catch (err) {
      setComments(previous);
      toast(err?.message || 'Could not delete the comment', 'danger');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section aria-labelledby="comments-heading" className="flex flex-col gap-4">
      <h2 id="comments-heading" className="flex items-center gap-2 text-xl font-semibold">
        <MessageSquare className="h-5 w-5 text-ink-muted" aria-hidden="true" />
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-ink-muted">
          No comments yet. Add the first one.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => {
            const isOwn = !!user && comment.author?.id === user.id;
            return (
              <li key={comment.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {comment.author?.display_name || 'Citizen'}
                  </p>
                  {comment.is_admin && (
                    <Badge tone="info">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Official
                    </Badge>
                  )}
                  <span className="text-xs text-ink-subtle">{timeAgo(comment.created_at)}</span>
                  {isOwn && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ink-muted hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  )}
                </div>
                {/* Plain text only — never dangerouslySetInnerHTML with user content (rules.md §7). */}
                <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{comment.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {isSignedIn ? (
        <div className="flex flex-col gap-3">
          <Textarea
            label="Add a comment"
            placeholder="Share an update or extra detail about this issue…"
            maxLength={MAX_LENGTH}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!body.trim()}
            className="self-start"
          >
            Post comment
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-ink-muted">Sign in to join the conversation.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`)}
          >
            Sign in
          </Button>
        </div>
      )}
    </section>
  );
}
