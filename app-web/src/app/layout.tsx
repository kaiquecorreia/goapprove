'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Quicksand } from 'next/font/google';
import '../styles/globals.scss';
import { AuthProvider } from '../contexts/AuthContext';
import { AppShell } from '../components/AppShell';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { isPrivatePath } from '../config/navigation';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldShowMenus = isPrivatePath(pathname);

  return (
    <html lang="en" suppressHydrationWarning className={quicksand.className}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
          <SessionProvider>
            <AuthProvider>
              {shouldShowMenus ? <AppShell>{children}</AppShell> : children}
            </AuthProvider>
          </SessionProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
            offset={{ top: 16, right: 16, left: 16, bottom: 16 }}
            mobileOffset={{ top: 72, right: 12, left: 12, bottom: 20 }}
            toastOptions={{
              className: 'app-toast',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
