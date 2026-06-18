type Padding = 'sm' | 'md' | 'lg';

const paddingClasses: Record<Padding, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

interface CardProps {
  padding?: Padding;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ padding = 'md', interactive, className = '', children, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={[
        'bg-white rounded-xl border border-ink-200 shadow-xs',
        paddingClasses[padding],
        interactive ? 'cursor-pointer hover:border-ink-300 hover:shadow-md transition-all' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}
