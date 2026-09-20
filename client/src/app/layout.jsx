import { Space_Grotesk, DM_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from '@/lib/context/ToastContext';
import { NotificationProvider } from '@/lib/context/NotificationContext';
import SiteChrome from '@/components/layout/SiteChrome';
import { clerkAppearance } from '@/lib/utils/clerkAppearance';
import './globals.css';

const heading = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-heading',
});

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata = {
  title: 'Civic Fix',
  description: 'Report city problems, back the ones that matter, and see them fixed.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={`${heading.variable} ${body.variable}`}>
        <body>
          <ToastProvider>
            <NotificationProvider>
              <SiteChrome>{children}</SiteChrome>
            </NotificationProvider>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
