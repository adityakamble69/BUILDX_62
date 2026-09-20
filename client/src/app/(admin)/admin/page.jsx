import { currentUser } from '@clerk/nextjs/server';
import Card from '@/components/ui/Card';

// Placeholder shell so the Phase 4 role guard is testable. The real dashboard
// (KPI cards + charts) is built in Phase 7.
export default async function AdminDashboardPage() {
  const user = await currentUser();

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="font-heading text-[28px] font-bold leading-9">Dashboard</h1>
      <p className="mt-1 text-ink-muted">Overview of all reports and system activity.</p>

      <Card className="mt-6 max-w-xl">
        <h2 className="text-xl font-semibold">Admin access confirmed</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Signed in as {user?.primaryEmailAddress?.emailAddress ?? 'an admin'} with the admin role.
          KPI cards, the reports table, and charts arrive in Phase 7.
        </p>
      </Card>
    </div>
  );
}
