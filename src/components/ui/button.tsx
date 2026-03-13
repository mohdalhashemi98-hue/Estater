import { type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const variantStyles = {
  default: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
  outline: 'border border-surface-border text-text-secondary hover:bg-white/60',
  ghost: 'text-text-secondary hover:bg-surface-overlay',
} as const;

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  default: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-sm rounded-xl',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
