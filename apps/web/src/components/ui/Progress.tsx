type ProgressTone = 'brand' | 'success';

const barClasses: Record<ProgressTone, string> = {
  brand: 'bg-brand',
  success: 'bg-success',
};

interface ProgressProps {
  value: number;
  max: number;
  label?: string;
  tone?: ProgressTone;
  showValue?: boolean;
}

export function Progress({ value, max, label, tone = 'brand', showValue = true }: ProgressProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      {(label || showValue) && (
        <div className="flex justify-between text-[13px] text-ink-500">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono text-[12px]">{pct}%</span>}
        </div>
      )}
      <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barClasses[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
