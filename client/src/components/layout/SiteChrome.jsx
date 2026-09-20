'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useNotifications } from '@/lib/context/NotificationContext';

/**
 * Public chrome (navbar + footer). Admin routes render their own Sidebar shell,
 * so the public chrome is skipped there instead of splitting the app into a
 * second route group (architecture.md §5).
 */
export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const { unreadCount } = useNotifications();

  if (isAdmin) return children;

  return (
    <>
      <Navbar unreadNotifications={unreadCount} />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
    </>
  );
}
