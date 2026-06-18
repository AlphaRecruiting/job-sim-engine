type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  brand: 'bg-blue-100 text-blue-700',
  success: 'bg-success-subtle text-success-dark',
  warning: 'bg-warning-subtle text-warning-dark',
  danger: 'bg-danger-subtle text-danger-dark',
  neutral: 'bg-ink-100 text-ink-600',
};

const dotClasses: Record<Tone, string> = {
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-ink-400',
};

interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', dot, children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-0.5 rounded-md ${toneClasses[tone]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-none ${dotClasses[tone]}`} />}
      {children}
    </span>
  );
}
