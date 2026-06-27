'use client';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

type Suggestion = { label: string };

export function CityAutocomplete({
  label = 'Città / Posizione',
  placeholder = 'es. Milano, Italia',
  value,
  onChange,
  className = '',
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function handleChange(v: string) {
    onChange(v);
    setOpen(false);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length < 2) { setLoading(false); return; }

    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);

      fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(v)}&limit=7&lang=it`,
        { signal: ctrl.signal }
      )
        .then(r => r.json())
        .then((data: any) => {
          const seen = new Set<string>();
          const items: Suggestion[] = (data.features ?? [])
            .filter((f: any) => ['city', 'town', 'village', 'municipality', 'borough', 'suburb'].includes(f.properties?.osm_value))
            .map((f: any) => {
              const p = f.properties;
              const name = p.name ?? '';
              const state = p.state && p.state !== name ? p.state : '';
              const country = p.country ?? '';
              const label = [name, state, country].filter(Boolean).join(', ');
              return { label };
            })
            .filter((s: Suggestion) => {
              if (!s.label || seen.has(s.label)) return false;
              seen.add(s.label);
              return true;
            });
          setSuggestions(items);
          setOpen(items.length > 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 280);
  }

  function pick(label: string) {
    onChange(label);
    setSuggestions([]);
    setOpen(false);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none z-10" />
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2.5 border border-ink-200 rounded-xl text-[14px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 animate-spin pointer-events-none" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[999] left-0 right-0 top-full mt-1 bg-white border border-ink-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(s.label)}
                className="w-full text-left px-4 py-2.5 text-[13px] text-ink-800 hover:bg-ink-50 flex items-center gap-2.5 transition-colors"
              >
                <MapPin size={13} className="text-ink-400 flex-none" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
