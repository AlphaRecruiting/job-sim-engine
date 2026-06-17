'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  createdAt: string;
  organization: { name: string };
};

export default function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRemote, setFilterRemote] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/public/jobs')
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const departments = [...new Set(jobs.map(j => j.department).filter(Boolean))] as string[];
  const remotePolicies = [...new Set(jobs.map(j => j.remotePolicy).filter(Boolean))] as string[];

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.organization.name.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q);
    const matchDept = !filterDept || j.department === filterDept;
    const matchRemote = !filterRemote || j.remotePolicy === filterRemote;
    return matchSearch && matchDept && matchRemote;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">JS</span>
          </div>
          <span className="font-bold text-slate-900 text-lg hidden sm:block">JobSim</span>
        </Link>

        {/* Search bar in nav */}
        <div className="flex-1 max-w-xl relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ruolo, azienda o dipartimento…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link href="/candidate/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors px-3 py-2 hidden sm:block">
            Accedi
          </Link>
          <Link href="/employer" className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-3 py-2 hidden sm:block">
            Per le aziende
          </Link>
        </div>
      </nav>

      {/* Hero banner — compact */}
      <div className="bg-white border-b border-slate-100 px-6 py-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Trova il lavoro giusto.<br className="hidden sm:block" /> Dimostra le tue competenze.
        </h1>
        <p className="text-slate-500 text-base max-w-lg mx-auto">
          Ogni offerta include una simulazione lavorativa reale. Niente lettere di presentazione — mostri cosa sai fare, non solo chi sei.
        </p>
      </div>

      {/* Filters + count bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500 mr-auto">
          {loading ? 'Caricamento…' : `${filtered.length} offert${filtered.length === 1 ? 'a' : 'e'}`}
        </span>

        {departments.length > 0 && (
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tutti i dipartimenti</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        {remotePolicies.length > 0 && (
          <select
            value={filterRemote}
            onChange={e => setFilterRemote(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Tutte le modalità</option>
            {remotePolicies.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}

        {(filterDept || filterRemote || search) && (
          <button
            onClick={() => { setSearch(''); setFilterDept(''); setFilterRemote(''); }}
            className="text-xs text-slate-400 hover:text-slate-700 transition"
          >
            Cancella filtri ×
          </button>
        )}
      </div>

      {/* Job listings */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-56 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-32 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-slate-500 text-lg font-medium mb-1">
              {jobs.length === 0 ? 'Nessuna posizione aperta al momento' : 'Nessuna offerta corrisponde alla ricerca'}
            </p>
            <p className="text-slate-400 text-sm">
              {jobs.length === 0 ? 'Torna a controllare presto.' : 'Prova con parole chiave diverse o rimuovi i filtri.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(job => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-semibold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{job.title}</h2>
                      {job.activeSimulationVersionId && (
                        <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                          Simulazione inclusa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{job.organization.name}</p>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{job.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.department && <Tag>{job.department}</Tag>}
                  {job.seniority && <Tag>{job.seniority}</Tag>}
                  {job.employmentType && <Tag>{EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType}</Tag>}
                  {job.location && <Tag>📍 {job.location}</Tag>}
                  {job.remotePolicy && <Tag>{REMOTE_LABELS[job.remotePolicy] ?? job.remotePolicy}</Tag>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 px-8 flex items-center justify-between text-xs text-slate-400 mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">JS</span>
          </div>
          <span className="font-medium">JobSim</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/employer" className="hover:text-slate-600 transition-colors">Per le aziende</Link>
          <Link href="/candidate/login" className="hover:text-slate-600 transition-colors">Accedi</Link>
          <span>© {new Date().getFullYear()} JobSim</span>
        </div>
      </footer>
    </div>
  );
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contratto',
  internship: 'Stage',
};

const REMOTE_LABELS: Record<string, string> = {
  remote: '🌐 Remoto',
  hybrid: '🏠 Ibrido',
  onsite: '🏢 In sede',
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
      {children}
    </span>
  );
}
