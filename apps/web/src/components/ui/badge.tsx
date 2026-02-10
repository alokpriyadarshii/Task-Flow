import * as React from 'react';
import { cn } from '../../lib/utils';

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'info';
};

export function Badge({ className, variant = 'default', ...props }: Props) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur';
  const styles =
    variant === 'success'
      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
      : variant === 'warning'
        ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
        : variant === 'info'
          ? 'border-indigo-400/20 bg-indigo-500/10 text-indigo-200'
          : 'border-white/10 bg-white/5 text-zinc-200';
  return <span className={cn(base, styles, className)} {...props} />;
}
