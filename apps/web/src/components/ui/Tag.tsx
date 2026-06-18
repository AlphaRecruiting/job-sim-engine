interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  active?: boolean;
}

export function Tag({ children, onRemove, active }: TagProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] font-medium px-2.5 py-1 rounded-md transition-colors ${
      active ? 'bg-brand text-white' : 'bg-ink-100 text-ink-600'
    }`}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity leading-none"
        >×</button>
      )}
    </span>
  );
}
