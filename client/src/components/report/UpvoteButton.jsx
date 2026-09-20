'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import { authPaths } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useToast } from '@/lib/context/ToastContext';

/**
 * Toggle upvote with optimistic UI (phases.md Phase 6 — "optimistic upvote, toasts").
 * The server returns the authoritative `{ upvoted, upvoteCount }`, so the optimistic
 * guess is replaced on success and rolled back on failure.
 *
 * Guests are sent to sign-in with a redirect back here rather than being shown a
 * disabled button — the action is allowed, they just need an account first.
 *
 * @param {{ reportId: string, initialCount?: number, initialUpvoted?: boolean }} props
 */
export default function UpvoteButton({ reportId, initialCount = 0, initialUpvoted = false }) {
  const { request, isLoaded, isSignedIn } = useApi();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname)}`);
      return;
    }

    const previous = { count, upvoted };
    setUpvoted(!upvoted);
    setCount(count + (upvoted ? -1 : 1));
    setPending(true);

    try {
      const { data } = await request(authPaths.reportUpvote(reportId), { method: 'POST' });
      setUpvoted(data.upvoted);
      setCount(data.upvoteCount);
    } catch (err) {
      setUpvoted(previous.upvoted);
      setCount(previous.count);
      toast(err?.message || 'Could not register your upvote', 'danger');
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={upvoted ? 'accent' : 'secondary'}
      onClick={handleClick}
      disabled={!isLoaded || pending}
      aria-pressed={upvoted}
      className="w-full"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      {count} {upvoted ? 'Upvoted' : 'Upvote'}
    </Button>
  );
}
