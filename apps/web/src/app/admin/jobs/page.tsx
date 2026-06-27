'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Briefcase, Users, Zap, AlertTriangle, ChevronRight, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui';

type Job = {
  id: string;
  title: string;
  status: string;
  department?: string;
  location?: string;
  remotePolicy?: string;
  employmentType?: string;
  activeSimulationVersionId?: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' | 'brand' }> = {
  published: { label: 'Pubblicata', tone: 'success'  },
  draft:     { label: 'Bozza',      tone: 'warning'  },
  closed:    { label: 'Chiusa',     tone: 'neutral'  },
  archived:  { label: 'Archiviata',tone: 'danger'   },
};

const REMOTE: Record<string, string> = {
  remote: 'Remoto', hybrid: 'Ibrido', onsite: 'In sede',
};

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Ieri';
  if (days < 30) return `${days}g fa`;
  return `${Math.floor(days / 30)}m fa`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[12px] font-semibold text-ink-400 uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="h-px flex-1 bg-ink-100" />
    </div>
  );
}

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Job[]>('/api/jobs')
      .then(setJobs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeJobs   = jobs.filter(j => j.status !== 'archived' && j.status !== 'closed');
  const missingSim   = jobs.filter(j => !j.activeSimulationVersionId && j.status !== 'archived');
  const published    = jobs.filter(j => j.status === 'published');
  const drafts       = jobs.filter(j => j.status === 'draft');

  return (
    <div className="max-w-3xl mx-auto py-10 px-2">

      {/* ── Hero ── */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-5">
          <Briefcase size={26} className="text-white" />
        </div>
        <h1 className="text-[26px] font-bold text-ink-950 font-display leading-tight">
          Le tue offerte di lavoro
        </h1>
        <p className="text-[14px] text-ink-400 mt-1.5">
          {loading ? '…' : jobs.length === 0
            ? 'Nessuna offerta ancora — creane una per iniziare.'
            : `${published.length} pubblicate · ${drafts.length} in bozza · ${jobs.length} totali`}
        </p>
        <div className="mt-5">
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-[13px] font-semibold hover:bg-brand/90 transition-colors"
          >
            <Plus size={15} />
            Nuova offerta
          </Link>
        </div>
      </div>

      {/* ── Action items ── */}
      {!loading && missingSim.length > 0 && (
        <div className="mb-8">
          <SectionLabel>Azioni richieste</SectionLabel>
          <div className="flex flex-col gap-2">
            {missingSim.map(job => (
              <button
                key={job.id}
                type="button"
                onClick={() => router.push(`/admin/jobs/${job.id}`)}
                className="w-full flex items-center gap-4 bg-white border border-ink-200 rounded-xl px-4 py-3.5 hover:bg-ink-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-warning-subtle flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-ink-900 truncate">{job.title}</div>
                  <div className="text-[12px] text-ink-400 mt-0.5">Nessuna simulazione collegata</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={STATUS[job.status]?.tone ?? 'neutral'} dot>{STATUS[job.status]?.label ?? job.status}</Badge>
                  <ChevronRight size={14} className="text-ink-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Job grid ── */}
      {loading ? (
        <div>
          <SectionLabel>Offerte</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-ink-200 p-5 h-28 animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <p className="text-[13px] text-danger text-center">{error}</p>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-ink-400">
          <FileText size={36} className="mx-auto mb-3 text-ink-200" />
          <p className="text-[14px] font-medium">Nessuna offerta ancora</p>
          <p className="text-[13px] mt-1">Crea la prima posizione con simulazione.</p>
        </div>
      ) : (
        <div>
          {activeJobs.length > 0 && (
            <>
              <SectionLabel>Offerte attive</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {activeJobs.map(job => {
                  const s = STATUS[job.status] ?? { label: job.status, tone: 'neutral' as const };
                  const hasSim = !!job.activeSimulationVersionId;
                  const subtitle = [
                    job.department,
                    job.location,
                    job.remotePolicy ? REMOTE[job.remotePolicy] : undefined,
                  ].filter(Boolean).join(' · ');

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      className="group flex flex-col bg-white border border-ink-200 rounded-2xl p-5 text-left hover:border-ink-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasSim ? 'bg-brand-subtle' : 'bg-ink-100'}`}>
                          {hasSim
                            ? <Zap size={16} className="text-blue-600" />
                            : <Briefcase size={16} className="text-ink-400" />}
                        </div>
                        <Badge tone={s.tone} dot>{s.label}</Badge>
                      </div>
                      <div className="text-[14px] font-bold text-ink-950 font-display leading-snug mb-1">{job.title}</div>
                      <div className="text-[12px] text-ink-400 flex-1">
                        {subtitle || <span className="italic text-ink-300">Nessuna sede</span>}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[11px] text-ink-300">{timeAgo(job.updatedAt)}</span>
                        <Link
                          href={`/admin/jobs/${job.id}/candidates`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-[11px] font-semibold text-ink-500 hover:text-brand transition-colors"
                        >
                          <Users size={11} />
                          Candidati
                        </Link>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Closed / Archived */}
          {jobs.filter(j => j.status === 'closed' || j.status === 'archived').length > 0 && (
            <>
              <SectionLabel>Archiviate / Chiuse</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {jobs.filter(j => j.status === 'closed' || j.status === 'archived').map(job => {
                  const s = STATUS[job.status] ?? { label: job.status, tone: 'neutral' as const };
                  const subtitle = [job.department, job.location].filter(Boolean).join(' · ');

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      className="flex flex-col bg-white border border-ink-200 rounded-2xl p-5 text-left opacity-60 hover:opacity-100 hover:border-ink-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
                          <Briefcase size={16} className="text-ink-300" />
                        </div>
                        <Badge tone={s.tone} dot>{s.label}</Badge>
                      </div>
                      <div className="text-[14px] font-bold text-ink-950 font-display leading-snug mb-1">{job.title}</div>
                      <div className="text-[12px] text-ink-400">{subtitle || <span className="italic text-ink-300">—</span>}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
