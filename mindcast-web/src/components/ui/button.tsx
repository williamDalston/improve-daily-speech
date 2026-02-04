'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation',
  {
    variants: {
      variant: {
        default:
          'bg-brand text-white font-semibold shadow-soft hover:bg-brand-dark hover:shadow-medium active:scale-[0.98]',
        secondary:
          'bg-surface-tertiary text-text-primary hover:bg-border active:scale-[0.98]',
        outline:
          'border border-border bg-transparent hover:bg-surface-secondary active:scale-[0.98]',
        ghost: 'hover:bg-surface-tertiary active:bg-surface-secondary',
        link: 'text-brand underline-offset-4 hover:underline',
        danger:
          'bg-error text-white hover:bg-red-600 active:scale-[0.98]',
      },
      size: {
        default: 'h-11 px-5 py-2 sm:h-10',
        sm: 'h-9 px-3 text-xs sm:h-8',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11 sm:h-10 sm:w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
