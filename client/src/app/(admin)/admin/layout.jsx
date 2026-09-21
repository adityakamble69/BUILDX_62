import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import Sidebar from '@/components/layout/Sidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';

export const metadata = { title: 'Admin · Civic Fix' };

/**
 * Second line of defence behind middleware.js: if the matcher is ever changed or
 * bypassed, this layout still refuses to render for non-admins. Neither check is
 * security — the Express requireAdmin middleware is (architecture.md §9).
 */
export default async function AdminLayout({ children }) {
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect('/sign-in');
  if (sessionClaims?.metadata?.role !== 'admin') redirect('/');

  const user = await currentUser();
  const adminName = user?.firstName || user?.username || 'Admin';
  const adminEmail = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <div className="flex min-h-screen bg-bg md:flex-row">
      <Sidebar adminName={adminName} adminEmail={adminEmail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar adminName={adminName} adminEmail={adminEmail} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}