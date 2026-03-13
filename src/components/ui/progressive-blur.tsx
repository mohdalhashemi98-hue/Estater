import { cn } from '../../lib/utils';

interface ProgressiveBlurProps {
  className?: string;
  direction?: 'left' | 'right';
}

export function ProgressiveBlur({ className, direction = 'left' }: ProgressiveBlurProps) {
  return (
    <div
      className={cn(
        'absolute top-0 bottom-0 w-24 pointer-events-none z-10',
        direction === 'left' ? 'left-0' : 'right-0',
        className,
      )}
      style={{
        background:
          direction === 'left'
            ? 'linear-gradient(to right, var(--blur-from, #faf9f5) 0%, transparent 100%)'
            : 'linear-gradient(to left, var(--blur-from, #faf9f5) 0%, transparent 100%)',
      }}
    />
  );
}
