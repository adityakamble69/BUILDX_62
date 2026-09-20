import AuthCheck from '@/components/layout/AuthCheck';

// Temporary Phase 4 page (like /style-guide): proves a Clerk token reaches Express
// and that the role claim survives the trip. Delete before the demo.
export const metadata = { title: 'Auth check · Civic Fix' };

export default function AuthCheckPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
      <h1 className="font-heading text-[28px] font-bold leading-9">Auth check</h1>
      <p className="mt-2 max-w-xl text-ink-muted">
        Temporary Phase 4 page. Calls <code>GET /api/v1/me</code> and the admin-only{' '}
        <code>GET /api/v1/admin/ping</code> with your Clerk token.
      </p>
      <div className="mt-6 max-w-xl">
        <AuthCheck />
      </div>
    </div>
  );
}
