'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface TipProps {
  content: string;
  children?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tip({ content, children, side = 'top', className }: TipProps) {
  const [show, setShow] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children || (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary cursor-help transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110">
          <Info className="w-2.5 h-2.5" />
        </span>
      )}
      {show && (
        <span
          className={cn(
            'absolute z-[100] px-3 py-2 text-xs font-medium rounded-lg',
            'bg-foreground text-background',
            'shadow-lg shadow-foreground/10',
            'animate-scale-in whitespace-nowrap max-w-xs',
            positionClasses[side]
          )}
        >
          {content}
          <span
            className={cn(
              'absolute w-2 h-2 bg-foreground rotate-45',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
            )}
          />
        </span>
      )}
    </span>
  );
}
