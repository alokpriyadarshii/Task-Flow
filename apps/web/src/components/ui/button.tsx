import * as React from 'react';
import { cn } from '../../lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/30 disabled:pointer-events-none disabled:opacity-50';

  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-b from-zinc-50 to-zinc-200 text-zinc-950 shadow-sm shadow-black/30 hover:from-white hover:to-zinc-100'
      : variant === 'secondary'
        ? 'border border-white/10 bg-white/5 text-zinc-50 shadow-sm shadow-black/20 hover:bg-white/10'
        : 'bg-transparent text-zinc-200 hover:bg-white/5';

  return <button className={cn(base, styles, className)} {...props} />;
}
