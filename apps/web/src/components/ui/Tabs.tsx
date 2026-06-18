'use client';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  value: string;
  onChange: (id: string) => void;
  tabs: Tab[];
}

export function Tabs({ value, onChange, tabs }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-ink-200">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold border-b-2 -mb-px transition-colors ${
            value === tab.id
              ? 'border-brand text-ink-950'
              : 'border-transparent text-ink-500 hover:text-ink-700'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-[12px] px-1.5 py-0.5 rounded font-semibold leading-none ${
              value === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-ink-100 text-ink-500'
            }`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
