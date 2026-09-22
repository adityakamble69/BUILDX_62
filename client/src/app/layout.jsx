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
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-icon.png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      {/* suppressHydrationWarning: browser extensions (LastPass, Grammarly, etc.) stamp
          extra class names onto <html> before React hydrates, which trips a false-positive
          mismatch on the font-variable className below. Same reasoning as memory.md D32,
          which added it to form fields for the fdprocessedid attribute. This only
          suppresses the warning on this element's own attributes — the subtree is untouched. */}
      <html
        lang="en"
        className={`${heading.variable} ${body.variable}`}
        suppressHydrationWarning
      >
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