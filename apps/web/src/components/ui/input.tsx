import * as React from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200/30',
        className,
      )}
      {...props}
    />
  );
}
