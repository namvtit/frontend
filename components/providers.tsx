'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { DemoProvider } from '@/lib/demo';
import { ToastContainer } from '@/components/ui/toast';

// Filter out React 19 false-positive warning for next-themes inline script
const origError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return;
  origError(...args);
};

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
