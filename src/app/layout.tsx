import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { PWARegister } from '@/components/pwa/PWARegister';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BookKeep-It | Interactive Bookkeeping Learning Management Platform',
  description:
    'Master bookkeeping principles, debits & credits, journals, trial balance, and financial statements with interactive quizzes, templates, and progress tracking.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.jpeg', type: 'image/jpeg' }
    ],
    shortcut: ['/favicon.ico', '/logo.jpeg'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BookKeep-It'
  }
};

export const viewport: Viewport = {
  themeColor: '#0077b6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-slate-50 text-slate-800 flex flex-row">
        <PWARegister />
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}

