'use client';
import { type ReactNode, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-active shadow-xs',
  secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 shadow-xs',
  ghost: 'text-ink-600 hover:bg-ink-100',
  inverse: 'bg-white text-ink-950 hover:bg-ink-50 shadow-sm',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-[14px] gap-2 rounded-lg',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', iconLeft, iconRight, block, className = '', children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap',
        variants[variant],
        sizes[size],
        block ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
);
Button.displayName = 'Button';
