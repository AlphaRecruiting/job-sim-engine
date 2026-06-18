type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const styles: Record<AlertTone, { wrap: string; title: string; body: string }> = {
  info:    { wrap: 'bg-blue-50 border-blue-100',       title: 'text-blue-900',       body: 'text-blue-700' },
  success: { wrap: 'bg-success-subtle border-success/20', title: 'text-success-dark',  body: 'text-success-dark' },
  warning: { wrap: 'bg-warning-subtle border-warning/20', title: 'text-warning-dark',  body: 'text-warning-dark' },
  danger:  { wrap: 'bg-danger-subtle border-danger/20',   title: 'text-danger-dark',   body: 'text-danger' },
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, className = '' }: AlertProps) {
  const s = styles[tone];
  return (
    <div className={`border rounded-lg p-4 ${s.wrap} ${className}`}>
      {title && <div className={`text-[14px] font-semibold mb-1 ${s.title}`}>{title}</div>}
      {children && <div className={`text-[14px] leading-relaxed ${s.body}`}>{children}</div>}
    </div>
  );
}
