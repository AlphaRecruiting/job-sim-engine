'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Zap, Sparkles, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Badge, Card, Stat, Progress, Alert } from '@/components/ui';

type Job = {
  id: string;
  title: string;
  description: string;
  status: string;
  department?: string;
  seniority?: string;
  location?: string;
  remotePolicy?: string;
  employmentType?: string;
  activeSimulationVersionId?: string;
};

type Analytics = {
  totalApplications: number;
  completedResults: number;
  averageScore?: number;
  results: Array<{ totalScore?: number; recommendation?: string }>;
};

type AiRun = { id: string; status: string; result?: { recommendedSteps?: unknown[] } };

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' | 'brand' }> = {
  published: { label: 'Pubblicata', tone: 'success' },
  draft:     { label: 'Bozza',      tone: 'warning' },
  closed:    { label: 'Chiusa',     tone: 'neutral' },
  archived:  { label: 'Archiviata',tone: 'danger'  },
};

const REC_LABELS: Record<string, { label: string; color: string }> = {
  strong_yes:     { label: 'Fortemente sì', color: 'bg-success' },
  yes:            { label: 'Sì',            color: 'bg-blue-500' },
  maybe:          { label: 'Forse',         color: 'bg-warning' },
  no:             { label: 'No',            color: 'bg-danger' },
  review_required:{ label: 'Da rivedere',   color: 'bg-ink-400' },
};

const REMOTE: Record<string, string> = {
  remote: 'Remoto', hybrid: 'Ibrido', onsite: 'In sede',
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  const [job, setJob]           = useState<Job | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [aiRun, setAiRun]       = useState<AiRun | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg]           = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);

  useEffect(() => {
    api.get<Job>(`/api/jobs/${jobId}`).then(setJob);
    api.get<Analytics>(`/api/jobs/${jobId}/analytics`).then(setAnalytics).catch(() => {});
  }, [jobId]);

  async function generateSimulation() {
    setGenerating(true); setMsg(null);
    try {
      const run = await api.post<AiRun>(`/api/jobs/${jobId}/recommend-simulation`);
      setAiRun(run);
      setMsg({ tone: 'info', text: 'Analisi AI avviata — attendi qualche secondo…' });
      const interval = setInterval(async () => {
        const updated = await api.get<AiRun>(`/api/ai-recommendation-runs/${run.id}`);
        setAiRun(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
          setMsg(updated.status === 'completed'
            ? { tone: 'success', text: 'Raccomandazione AI pronta.' }
            : { tone: 'danger',  text: 'Generazione fallita — riprova.' });
        }
      }, 3000);
    } catch (e: any) {
      setMsg({ tone: 'danger', text: e.message });
    } finally {
      setGenerating(false);
    }
  }

  async function publishJob() {
    setPublishing(true); setMsg(null);
    try {
      await api.post(`/api/jobs/${jobId}/publish`);
      setJob(j => j ? { ...j, status: 'published' } : j);
      setMsg({ tone: 'success', text: 'Offerta pubblicata con successo.' });
    } catch (e: any) {
      setMsg({ tone: 'danger', text: e.message });
    } finally {
      setPublishing(false);
    }
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-ink-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const s = STATUS[job.status] ?? { label: job.status, tone: 'neutral' as const };

  // Analytics calculations
  const recCounts = analytics?.results.reduce((acc: Record<string, number>, r) => {
    if (r.recommendation) acc[r.recommendation] = (acc[r.recommendation] ?? 0) + 1;
    return acc;
  }, {}) ?? {};
  const completionRate = analytics && analytics.totalApplications > 0
    ? Math.round((analytics.completedResults / analytics.totalApplications) * 100)
    : 0;
  const shortlisted = analytics?.results.filter(r => r.recommendation === 'strong_yes' || r.recommendation === 'yes').length ?? 0;

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/jobs')}
          className="text-ink-400 hover:text-ink-700 transition-colors flex items-center gap-1 text-[14px]"
        >
          <ArrowLeft size={15} /> Offerte
        </button>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[28px]">{job.title}</h1>
            <Badge tone={s.tone} dot>{s.label}</Badge>
          </div>
          <p className="text-[14px] text-ink-500">
            {[job.department, job.seniority, job.remotePolicy ? REMOTE[job.remotePolicy] : undefined, job.location]
              .filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <Link href={`/admin/jobs/${jobId}/simulation`}>
            <Button variant="secondary" size="sm" iconLeft={<Zap size={14} />}>Simulazione</Button>
          </Link>
          <Link href={`/admin/jobs/${jobId}/candidates`}>
            <Button variant="secondary" size="sm" iconLeft={<Users size={14} />}>Candidati</Button>
          </Link>
          {job.status !== 'published' && (
            <Button size="sm" onClick={publishJob} disabled={publishing}>
              {publishing ? 'Pubblicazione…' : 'Pubblica'}
            </Button>
          )}
        </div>
      </div>

      {msg && (
        <Alert tone={msg.tone} className="mb-6">{msg.text}</Alert>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <Card padding="md">
          <Stat value={String(analytics?.totalApplications ?? 0)} label="Candidature" />
        </Card>
        <Card padding="md">
          <Stat value={String(analytics?.completedResults ?? 0)} label="Completate" />
        </Card>
        <Card padding="md">
          <Stat
            value={analytics?.averageScore != null ? `${Math.round(analytics.averageScore)}%` : '—'}
            label="Punteggio medio"
          />
        </Card>
        <Card padding="md">
          <Stat value={String(shortlisted)} label="Idonei (sì / forte sì)" />
        </Card>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* ─── Left: analytics + AI ─── */}
        <div className="flex flex-col gap-5">

          {/* Completion funnel */}
          <Card padding="lg">
            <h2 className="text-[16px] font-semibold mb-4">Tasso di completamento</h2>
            {analytics && analytics.totalApplications > 0 ? (
              <div className="flex flex-col gap-3">
                <Progress
                  value={completionRate}
                  max={100}
                  showValue
                  label={`${analytics.completedResults} su ${analytics.totalApplications} candidature completate`}
                  tone={completionRate >= 50 ? 'success' : 'brand'}
                />
                <div className="flex gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-[13px] text-ink-500">
                    <CheckCircle size={13} className="text-success" />
                    {analytics.completedResults} completate
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] text-ink-500">
                    <Clock size={13} className="text-warning" />
                    {analytics.totalApplications - analytics.completedResults} in corso / non avviate
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-ink-400">Nessun dato ancora — i dati appariranno man mano che i candidati completano la simulazione.</p>
            )}
          </Card>

          {/* Recommendation distribution */}
          {Object.keys(recCounts).length > 0 && (
            <Card padding="lg">
              <h2 className="text-[16px] font-semibold mb-4">Distribuzione raccomandazioni</h2>
              <div className="flex flex-col gap-3">
                {Object.entries(recCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([rec, count]) => {
                    const meta = REC_LABELS[rec] ?? { label: rec, color: 'bg-ink-300' };
                    const pct = analytics!.completedResults > 0
                      ? Math.round((count / analytics!.completedResults) * 100)
                      : 0;
                    return (
                      <div key={rec} className="flex items-center gap-3">
                        <span className="text-[13px] text-ink-600 w-32 shrink-0">{meta.label}</span>
                        <div className="flex-1 bg-ink-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`${meta.color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[13px] font-semibold text-ink-700 w-8 text-right">{count}</span>
                        <span className="text-[12px] text-ink-400 w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* AI simulation recommendation */}
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-ink-950 flex items-center justify-center flex-none">
                <Sparkles size={17} className="text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold">Simulazione con AI</h2>
                <p className="text-[13px] text-ink-500">Genera automaticamente gli step in base ai requisiti del ruolo.</p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={generateSimulation}
              disabled={generating}
              iconLeft={<Sparkles size={14} />}
            >
              {generating ? 'Generazione…' : 'Genera con AI'}
            </Button>

            {aiRun && (
              <div className="mt-4 pt-4 border-t border-ink-100 flex items-center gap-3">
                <Badge
                  tone={aiRun.status === 'completed' ? 'success' : aiRun.status === 'failed' ? 'danger' : 'warning'}
                  dot
                >
                  {aiRun.status === 'completed' ? 'Completato' : aiRun.status === 'failed' ? 'Fallito' : 'In elaborazione'}
                </Badge>
                {aiRun.status === 'completed' && aiRun.result && (
                  <Link
                    href={`/admin/jobs/${jobId}/recommendations/${aiRun.id}`}
                    className="text-[13px] font-semibold text-brand hover:underline flex items-center gap-1"
                  >
                    Vedi {aiRun.result.recommendedSteps?.length ?? 0} step raccomandati
                    <ChevronRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ─── Right: job info ─── */}
        <div className="flex flex-col gap-5">
          <Card padding="md">
            <h2 className="text-[14px] font-semibold text-ink-700 mb-3">Dettagli offerta</h2>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Stato',       value: s.label },
                { label: 'Dipartimento',value: job.department  },
                { label: 'Seniority',   value: job.seniority   },
                { label: 'Sede',        value: job.location    },
                { label: 'Modalità',    value: job.remotePolicy ? REMOTE[job.remotePolicy] : undefined },
                { label: 'Tipo',        value: job.employmentType },
              ].filter(r => r.value).map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-[13px] text-ink-500 shrink-0">{label}</span>
                  <span className="text-[13px] font-medium text-ink-800 text-right">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {job.activeSimulationVersionId && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-brand" />
                <h2 className="text-[14px] font-semibold text-ink-700">Simulazione attiva</h2>
              </div>
              <p className="text-[13px] text-ink-500 mb-3">Questa offerta ha una simulazione pubblicata e visibile ai candidati.</p>
              <Link href={`/admin/jobs/${jobId}/simulation`}>
                <Button size="sm" variant="secondary" block>Modifica simulazione</Button>
              </Link>
            </Card>
          )}

          <Card padding="md">
            <h2 className="text-[14px] font-semibold text-ink-700 mb-2">Descrizione</h2>
            <p className="text-[13px] text-ink-600 leading-relaxed line-clamp-6">{job.description}</p>
          </Card>

          <Link href={`/admin/jobs/${jobId}/candidates`}>
            <Card padding="md" interactive>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-ink-100 flex items-center justify-center flex-none">
                  <Users size={16} className="text-ink-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-ink-800">Vedi tutti i candidati</div>
                  <div className="text-[12px] text-ink-500">{analytics?.totalApplications ?? 0} candidature ricevute</div>
                </div>
                <ChevronRight size={15} className="text-ink-300" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
