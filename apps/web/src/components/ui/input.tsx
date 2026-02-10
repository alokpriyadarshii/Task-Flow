import * as React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200/30',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
