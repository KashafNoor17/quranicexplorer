import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <div 
      className={cn('flex items-center gap-2 text-muted-foreground', className)}
      role="status"
      aria-label={label || 'Loading'}
    >
      <Loader2 className={cn('animate-spinner', sizeClasses[size])} />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  label?: string;
}

export function LoadingOverlay({ isLoading, label }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
