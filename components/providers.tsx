'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ToastContainer } from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        {children}
        <ToastContainer />
      </AuthProvider>
    </ThemeProvider>
  );
}
