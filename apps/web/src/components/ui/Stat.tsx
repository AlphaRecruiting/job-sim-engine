interface StatProps {
  value: string;
  label: string;
  delta?: { value: string; dir: 'up' | 'down' };
}

export function Stat({ value, label, delta }: StatProps) {
  return (
    <div>
      <div className="text-[30px] font-bold font-display text-ink-950 leading-none">{value}</div>
      <div className="text-[13px] text-ink-500 mt-1.5">{label}</div>
      {delta && (
        <div className={`text-[12px] font-semibold mt-1 ${delta.dir === 'up' ? 'text-success' : 'text-danger'}`}>
          {delta.dir === 'up' ? '↑' : '↓'} {delta.value}
        </div>
      )}
    </div>
  );
}
