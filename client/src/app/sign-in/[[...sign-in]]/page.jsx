import { SignIn } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/utils/clerkAppearance';

export const metadata = { title: 'Sign in · Civic Fix' };

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 py-12 md:px-6">
      <div className="mb-6 max-w-md text-center">
        <h1 className="font-heading text-[28px] font-bold leading-9">Sign in to Civic Fix</h1>
        <p className="mt-2 text-ink-muted">
          You need an account to report an issue, upvote, or comment. Browsing the map stays open to everyone.
        </p>
      </div>
      <SignIn appearance={clerkAppearance} />
    </div>
  );
}
