import * as React from 'react';
import { cn } from '../../lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-zinc-200/40 disabled:opacity-50 disabled:pointer-events-none';

  const styles =
    variant === 'primary'
      ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
      : variant === 'secondary'
        ? 'bg-zinc-800 hover:bg-zinc-700'
        : 'bg-transparent hover:bg-zinc-900';

  return <button className={cn(base, styles, className)} {...props} />;
}
