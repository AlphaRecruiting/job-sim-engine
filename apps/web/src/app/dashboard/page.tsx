'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, LogIn, Briefcase, ArrowRight, Bookmark, X, Zap, Archive } from 'lucide-react';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import { Button, Badge, Card, Avatar, Progress } from '@/components/ui';
import { getSavedJobs, removeSavedJob, type SavedJob } from '@/lib/savedJobs';

type Profile = {
  id: string;
  email: string;
  name?: string;
  avatarData?: string;
};

type AppStatus =
  | 'invited' | 'started' | 'simulation_in_progress' | 'simulation_completed'
  | 'review_pending' | 'shortlisted' | 'rejected' | 'hired';

type Application = {
  id: string;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
  jobPosting: {
    id: string;
    title: string;
    department?: string;
    location?: string;
    remotePolicy?: string;
    employmentType?: string;
  };
  session: { id: string; status: string; completedAt: string | null } | null;
  result: { totalScore: number | null; recommendation: string | null } | null;
};

const STATUS_DISPLAY: Record<AppStatus, { label: string; tone: 'brand' | 'warning' | 'success' | 'neutral' | 'danger' }> = {
  invited:                { label: 'Invitato',               tone: 'neutral'  },
  started:                { label: 'Iniziata',               tone: 'brand'    },
  simulation_in_progress: { label: 'Simulazione in corso',   tone: 'brand'    },
  simulation_completed:   { label: 'Simulazione completata', tone: 'success'  },
  review_pending:         { label: 'In revisione',            tone: 'warning'  },
  shortlisted:            { label: 'In shortlist',            tone: 'success'  },
  rejected:               { label: 'Non selezionato',         tone: 'neutral'  },
  hired:                  { label: 'Assunto',                 tone: 'success'  },
};

const REMOTE_LABELS: Record<string, string> = {
  remote: 'Remoto', hybrid: 'Ibrido', onsite: 'In sede',
};

const STALE_DAYS = 30;

function isArchived(app: Application): boolean {
  if (app.status === 'rejected') return true;
  const days = Math.floor((Date.now() - new Date(app.updatedAt).getTime()) / 86400000);
  return days > STALE_DAYS && !['shortlisted', 'hired'].includes(app.status);
}

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Ieri';
  if (days < 30) return `${days}g fa`;
  return `${Math.floor(days / 30)}m fa`;
}

const TABS = [
  { id: 'salvati',     label: 'Salvati' },
  { id: 'inviate',     label: 'Candidature inviate' },
  { id: 'colloquio',   label: 'Inviti a colloquio' },
  { id: 'archiviati',  label: 'Archiviati' },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Application row ────────────────────────────────────────────────────────
function AppRow({ app }: { app: Application }) {
  const s = STATUS_DISPLAY[app.status] ?? { label: app.status, tone: 'neutral' as const };
  const hasSim = !!app.session;
  const done = app.session?.status === 'completed';
  const tone: 'brand' | 'success' = done ? 'success' : 'brand';

  return (
    <Link href={`/jobs/${app.jobPosting.id}`} className="block group">
      <Card padding="md" interactive>
        <div className="flex items-center gap-4">
          <Avatar name={app.jobPosting.title} square size="lg" />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-bold text-ink-950 font-display group-hover:text-brand transition-colors">
              {app.jobPosting.title}
            </div>
            <div className="text-[13px] text-ink-500 mt-0.5">
              {app.jobPosting.department ?? '—'}
              {app.jobPosting.location ? ` · ${app.jobPosting.location}` : ''}
              {' · '}{timeAgo(app.updatedAt)}
            </div>
          </div>
          {hasSim && (
            <div className="w-36 hidden sm:block">
              <Progress value={done ? 1 : 0} max={1} showValue={false} tone={tone} />
            </div>
          )}
          <div className="hidden md:flex justify-end">
            <Badge tone={s.tone} dot>{s.label}</Badge>
          </div>
          <ChevronRight size={16} className="text-ink-300 flex-none" />
        </div>
      </Card>
    </Link>
  );
}

// ─── Saved job row ───────────────────────────────────────────────────────────
function SavedJobRow({ job, onRemove }: { job: SavedJob; onRemove: (id: string) => void }) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-4">
        <Avatar name={job.organization.name} square size="lg" />
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-ink-950 font-display">{job.title}</div>
          <div className="text-[13px] text-ink-500 mt-0.5">
            {job.organization.name}
            {job.location ? ` · ${job.location}` : ''}
            {job.remotePolicy ? ` · ${REMOTE_LABELS[job.remotePolicy] ?? job.remotePolicy}` : ''}
          </div>
        </div>
        {job.activeSimulationVersionId && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-brand-subtle rounded-md shrink-0">
            <Zap size={12} className="text-blue-600" />
            <span className="text-[12px] text-blue-700 font-semibold">Sim. inclusa</span>
          </div>
        )}
        <Link
          href={`/jobs/${job.id}`}
          className="px-3 py-1.5 text-[13px] font-semibold text-brand border border-brand/30 rounded-lg hover:bg-brand-subtle transition-colors shrink-0"
        >
          Visualizza
        </Link>
        <button
          type="button"
          onClick={() => onRemove(job.id)}
          title="Rimuovi dai salvati"
          className="text-ink-300 hover:text-danger transition-colors p-1 shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </Card>
  );
}

// ─── Login gate ──────────────────────────────────────────────────────────────
function LoginGate() {
  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopNav />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-[400px] w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <LogIn size={28} className="text-blue-600" />
          </div>
          <h1 className="text-[28px] mb-2">I miei lavori</h1>
          <p className="text-[16px] text-ink-500 leading-relaxed mb-8">
            Accedi per vedere le candidature inviate, i colloqui programmati e le offerte salvate.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/candidate/login?redirect=/dashboard">
              <Button block size="lg" iconRight={<ArrowRight size={16} />}>Accedi</Button>
            </Link>
            <Link href="/candidate/login?redirect=/dashboard">
              <Button block size="lg" variant="secondary">Crea account gratuito</Button>
            </Link>
          </div>
          <p className="text-[13px] text-ink-400 mt-6">
            Non hai ancora candidature?{' '}
            <Link href="/" className="text-blue-600 font-semibold hover:underline">
              Sfoglia le offerte
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function Empty({ icon: Icon, title, subtitle, cta }: { icon: React.ElementType; title: string; subtitle?: string; cta?: React.ReactNode }) {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center mx-auto mb-4">
        <Icon size={22} className="text-ink-400" />
      </div>
      <p className="text-ink-500 text-[16px] font-semibold mb-1">{title}</p>
      {subtitle && <p className="text-ink-400 text-[14px] mb-5">{subtitle}</p>}
      {cta}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [authState, setAuthState] = useState<'loading' | 'guest' | 'authenticated'>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [tab, setTab] = useState<TabId>('salvati');
  const [saved, setSaved] = useState<SavedJob[]>([]);

  useEffect(() => {
    setSaved(getSavedJobs());
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('candidateToken');
    if (!token) { setAuthState('guest'); return; }

    setAppsLoading(true);
    fetch('/api/candidate/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((p: Profile) => {
        setProfile(p);
        setAuthState('authenticated');
        return fetch('/api/candidate/auth/applications', { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(r => r.ok ? r.json() : [])
      .then((data: Application[]) => setApps(data))
      .catch(() => setAuthState('guest'))
      .finally(() => setAppsLoading(false));
  }, []);

  function handleRemoveSaved(id: string) {
    removeSavedJob(id);
    setSaved(prev => prev.filter(j => j.id !== id));
  }

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-ink-50">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-ink-200 border-t-brand rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (authState === 'guest') return <LoginGate />;

  const displayName = profile?.name ?? profile?.email ?? 'Candidato';
  const firstWord = displayName.split(' ')[0];

  const activeApps    = apps.filter(a => !isArchived(a) && !['shortlisted', 'hired'].includes(a.status));
  const colloquioApps = apps.filter(a => ['shortlisted', 'hired'].includes(a.status));
  const archivedApps  = apps.filter(isArchived);

  const counts: Record<TabId, number> = {
    salvati:    saved.length,
    inviate:    activeApps.length,
    colloquio:  colloquioApps.length,
    archiviati: archivedApps.length,
  };

  const tabApps: Record<Exclude<TabId, 'salvati'>, Application[]> = {
    inviate:    activeApps,
    colloquio:  colloquioApps,
    archiviati: archivedApps,
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopNav />

      <div className="max-w-container mx-auto px-6 py-9 w-full flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar name={displayName} size="xl" src={profile?.avatarData} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[30px]">Ciao, {firstWord}</h1>
            <p className="text-[15px] text-ink-500 mt-1">
              {colloquioApps.length > 0
                ? `Hai ${colloquioApps.length} invit${colloquioApps.length === 1 ? 'o' : 'i'} a colloquio.`
                : activeApps.length > 0
                ? `${activeApps.length} candidatur${activeApps.length === 1 ? 'a' : 'e'} in corso.`
                : 'Benvenuto nella tua area personale.'}
            </p>
          </div>
          <Link href="/">
            <Button iconLeft={<Search size={15} />}>Trova offerte</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-ink-200 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-brand text-white' : 'bg-ink-100 text-ink-500'
                }`}>
                  {counts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">

          {/* Salvati */}
          {tab === 'salvati' && (
            saved.length === 0 ? (
              <Empty
                icon={Bookmark}
                title="Nessuna offerta salvata"
                subtitle="Usa il segnalibro sulle offerte per tenerle da parte."
                cta={<Link href="/"><Button iconRight={<ArrowRight size={15} />}>Sfoglia le offerte</Button></Link>}
              />
            ) : (
              saved.map(job => (
                <SavedJobRow key={job.id} job={job} onRemove={handleRemoveSaved} />
              ))
            )
          )}

          {/* Candidature inviate / Colloquio / Archiviati */}
          {tab !== 'salvati' && (
            appsLoading ? (
              <div className="flex justify-center py-14">
                <div className="w-6 h-6 border-2 border-ink-200 border-t-brand rounded-full animate-spin" />
              </div>
            ) : tabApps[tab].length === 0 ? (
              <Empty
                icon={tab === 'archiviati' ? Archive : Briefcase}
                title={
                  tab === 'inviate'    ? 'Nessuna candidatura inviata' :
                  tab === 'colloquio'  ? 'Nessun invito a colloquio' :
                  'Nessuna candidatura archiviata'
                }
                subtitle={
                  tab === 'inviate'   ? 'Le candidature che invii appariranno qui.' :
                  tab === 'colloquio' ? 'Qui troverai le selezioni che hanno richiesto un colloquio.' :
                  'Le candidature rifiutate o inattive da più di 30 giorni finiscono qui.'
                }
                cta={tab === 'inviate' ? (
                  <Link href="/"><Button iconRight={<ArrowRight size={15} />}>Sfoglia le offerte</Button></Link>
                ) : undefined}
              />
            ) : (
              tabApps[tab].map(a => <AppRow key={a.id} app={a} />)
            )
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
