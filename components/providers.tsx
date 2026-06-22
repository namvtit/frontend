'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { DemoProvider } from '@/lib/demo';
import { ToastContainer } from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <DemoProvider>
          {children}
          <ToastContainer />
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
