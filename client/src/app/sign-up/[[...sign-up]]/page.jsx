import { SignUp } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/utils/clerkAppearance';

export const metadata = { title: 'Create an account · Civic Fix' };

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 py-12 md:px-6">
      <div className="mb-6 max-w-md text-center">
        <h1 className="font-heading text-[28px] font-bold leading-9">Create your account</h1>
        <p className="mt-2 text-ink-muted">
          One account lets you report problems, back the ones that matter, and follow them to resolved.
        </p>
      </div>
      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
