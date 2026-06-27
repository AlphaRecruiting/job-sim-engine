'use client';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Zap, ArrowRight, Bookmark, X, SlidersHorizontal } from 'lucide-react';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import { Button, Tag, Card, Avatar, Badge } from '@/components/ui';

type Job = {
  id: string;
  title: string;
  description: string;
  department?: string;
  location?: string;
  remotePolicy?: string;
  seniority?: string;
  employmentType?: string;
  activeSimulationVersionId?: string;
  organization: { name: string };
};

const REMOTE_LABELS: Record<string, string> = {
  remote: 'Remoto', hybrid: 'Ibrido', onsite: 'In sede',
};
const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contratto', internship: 'Stage',
};

function jobMatchesLocation(job: Job, loc: string): boolean {
  if (!loc) return true;
  const l = loc.toLowerCase();
  if (job.location?.toLowerCase().includes(l)) return true;
  const remoteLabel = job.remotePolicy ? REMOTE_LABELS[job.remotePolicy]?.toLowerCase() : undefined;
  if (remoteLabel?.includes(l)) return true;
  return false;
}

function buildLocationOptions(jobs: Job[]): string[] {
  const cities = new Set<string>();
  const remotePolicies = new Set<string>();
  for (const j of jobs) {
    if (j.location) cities.add(j.location);
    if (j.remotePolicy && REMOTE_LABELS[j.remotePolicy]) remotePolicies.add(REMOTE_LABELS[j.remotePolicy]);
  }
  return [...remotePolicies, ...Array.from(cities).sort()];
}

function LocationInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const suggestions = options.filter(o => !value || o.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none z-10" />
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setFocused(true); }}
        onFocus={() => setFocused(true)}
        placeholder="Città o modalità"
        className="w-full pl-9 pr-8 py-2 border border-ink-200 rounded-lg text-[14px] text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-brand transition bg-white h-11"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500">
          <X size={14} />
        </button>
      )}
      {focused && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-ink-200 rounded-lg shadow-md overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(s); setFocused(false); }}
              className="w-full text-left px-3 py-2.5 text-[13px] text-ink-700 hover:bg-ink-50 flex items-center gap-2 transition-colors"
            >
              <MapPin size={13} className="text-ink-400 flex-none" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const company = job.organization.name;
  const tags = [
    job.department,
    job.seniority,
    job.employmentType ? EMPLOYMENT_LABELS[job.employmentType] : undefined,
  ].filter(Boolean) as string[];

  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const { isJobSaved } = require('@/lib/savedJobs');
    setSaved(isJobSaved(job.id));
  }, [job.id]);

  function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { toggleSavedJob } = require('@/lib/savedJobs');
    const next = toggleSavedJob({ id: job.id, title: job.title, organization: job.organization, location: job.location, remotePolicy: job.remotePolicy, department: job.department, employmentType: job.employmentType, activeSimulationVersionId: job.activeSimulationVersionId });
    setSaved(next);
  }

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card padding="md" interactive>
        <div className="flex gap-3 items-start">
          <Avatar name={company} square size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-ink-950 group-hover:text-brand transition-colors leading-snug">
              {job.title}
            </h3>
            <div className="text-[13px] text-ink-500 mt-0.5 truncate">
              {company}
              {job.location ? ` · ${job.location}` : ''}
              {job.remotePolicy ? ` · ${REMOTE_LABELS[job.remotePolicy] ?? job.remotePolicy}` : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={handleBookmark}
            title={saved ? 'Rimuovi dai salvati' : 'Salva offerta'}
            className={`transition-colors flex-none mt-0.5 ${saved ? 'text-brand' : 'text-ink-300 hover:text-ink-500'}`}
          >
            <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {tags.map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        )}

        {job.activeSimulationVersionId && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-subtle rounded-md mt-3">
            <Zap size={13} className="text-blue-600 flex-none" />
            <span className="text-[12px] text-blue-700 font-semibold">Simulazione inclusa</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-100">
          <p className="text-[12px] text-ink-500 line-clamp-1 flex-1 mr-3">
            {job.description.slice(0, 80)}…
          </p>
          <ArrowRight size={13} className="text-ink-300 group-hover:text-brand transition-colors flex-none" />
        </div>
      </Card>
    </Link>
  );
}

const REMOTE_FILTERS = [
  { label: 'Tutti', value: '' },
  { label: 'Remoto', value: 'remote' },
  { label: 'Ibrido', value: 'hybrid' },
  { label: 'In sede', value: 'onsite' },
];

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [location, setLocation] = useState(searchParams.get('location') ?? '');
  const [remoteFilter, setRemoteFilter] = useState('');

  useEffect(() => {
    fetch('/api/public/jobs')
      .then(r => r.json())
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const locationOptions = buildLocationOptions(jobs);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.organization.name.toLowerCase().includes(q) ||
      j.department?.toLowerCase().includes(q);
    const matchesLocation = jobMatchesLocation(j, location);
    const matchesRemote = !remoteFilter || j.remotePolicy === remoteFilter;
    return matchesSearch && matchesLocation && matchesRemote;
  });

  const hasFilters = search || location || remoteFilter;

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopNav />

      {/* Search header */}
      <div className="bg-white border-b border-ink-200 sticky top-[68px] z-30">
        <div className="max-w-container mx-auto px-6 py-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (search) params.set('q', search);
              if (location) params.set('location', location);
              router.replace(`/jobs?${params.toString()}`);
            }}
            className="flex gap-2 items-center"
          >
            {/* Role */}
            <div className="relative flex-[2_1_220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ruolo, competenza o azienda"
                className="w-full pl-9 pr-4 py-2 border border-ink-200 rounded-lg text-[14px] text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-brand transition bg-white h-11"
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-ink-200 self-stretch my-1" />

            {/* Location */}
            <LocationInput value={location} onChange={setLocation} options={locationOptions} />

            <Button type="submit" size="md" iconRight={<Search size={15} />}>Cerca</Button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-container mx-auto px-6 py-8 w-full flex-1">
        {/* Filters row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-[13px] font-semibold text-ink-500 flex items-center gap-1.5">
            <SlidersHorizontal size={14} />
            Modalità:
          </span>
          <div className="flex gap-1.5">
            {REMOTE_FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setRemoteFilter(f.value)}
                className={`text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  remoteFilter === f.value
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); setLocation(''); setRemoteFilter(''); }}
              className="ml-auto text-[13px] text-ink-500 hover:text-ink-800 flex items-center gap-1 transition-colors"
            >
              <X size={13} />
              Rimuovi filtri
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-end justify-between mb-5">
          <p className="text-[15px] text-ink-500">
            {loading
              ? 'Caricamento…'
              : <><span className="font-bold text-ink-950">{filtered.length}</span> posizion{filtered.length === 1 ? 'e' : 'i'} trovate</>}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-ink-200 p-5 animate-pulse">
                <div className="h-5 bg-ink-100 rounded w-40 mb-3" />
                <div className="h-3 bg-ink-100 rounded w-24 mb-4" />
                <div className="h-3 bg-ink-100 rounded w-full mb-2" />
                <div className="h-3 bg-ink-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink-500 text-[17px] font-semibold mb-1">
              {jobs.length === 0 ? 'Nessuna posizione aperta al momento' : 'Nessun risultato per questa ricerca'}
            </p>
            <p className="text-ink-400 text-[14px] mb-5">
              {jobs.length === 0 ? 'Torna a controllare presto.' : 'Prova a cambiare le parole chiave o il luogo.'}
            </p>
            {hasFilters && (
              <Button variant="secondary" onClick={() => { setSearch(''); setLocation(''); setRemoteFilter(''); }}>
                Rimuovi tutti i filtri
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  );
}
