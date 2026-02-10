'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      theme="dark"
      toastOptions={{
        className:
          'border border-white/10 bg-zinc-950/70 text-zinc-50 shadow-lg shadow-black/30 backdrop-blur',
      }}
    />
  );
}
