'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Zap, Briefcase, ClipboardCheck, Award, Sparkles, ArrowRight, Bookmark } from 'lucide-react';
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

function JobCard({ job }: { job: Job }) {
  const company = job.organization.name;
  const tags = [
    job.department,
    job.seniority,
    job.employmentType ? EMPLOYMENT_LABELS[job.employmentType] : undefined,
  ].filter(Boolean) as string[];

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card padding="md" interactive>
        <div className="flex gap-3 items-start">
          <Avatar name={company} square size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-ink-950 group-hover:text-brand transition-colors leading-snug">
              {job.title}
            </h3>
            <div className="text-[14px] text-ink-500 mt-0.5 truncate">
              {company}
              {job.location ? ` · ${job.location}` : ''}
              {job.remotePolicy ? ` · ${REMOTE_LABELS[job.remotePolicy] ?? job.remotePolicy}` : ''}
            </div>
          </div>
          <button
            type="button"
            className="text-ink-300 hover:text-ink-500 transition-colors flex-none mt-0.5"
            onClick={e => e.preventDefault()}
          >
            <Bookmark size={18} />
          </button>
        </div>

        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {tags.map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        )}

        {job.activeSimulationVersionId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-subtle rounded-md mt-3">
            <Zap size={14} className="text-blue-600 flex-none" />
            <span className="text-[13px] text-blue-700 font-semibold">Simulazione lavorativa inclusa</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-100">
          <p className="text-[13px] text-ink-500 line-clamp-1 flex-1 mr-3">
            {job.description.slice(0, 72)}…
          </p>
          <ArrowRight size={14} className="text-ink-300 group-hover:text-brand transition-colors flex-none" />
        </div>
      </Card>
    </Link>
  );
}

function HowStep({
  n,
  Icon,
  title,
  text,
}: {
  n: number;
  Icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-12 h-12 rounded-lg bg-ink-950 flex items-center justify-center flex-none">
        <Icon size={22} className="text-white" />
      </div>
      <div className="font-mono text-[12px] text-brand font-semibold">0{n}</div>
      <h3 className="text-[20px] font-bold text-ink-950">{title}</h3>
      <p className="text-[15px] text-ink-600 leading-relaxed">{text}</p>
    </div>
  );
}

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/public/jobs')
      .then(r => r.json())
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return (
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.organization.name.toLowerCase().includes(q) ||
      j.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopNav />

      {/* Hero */}
      <section className="bg-white border-b border-ink-200">
        <div className="max-w-container mx-auto px-6 py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-subtle rounded-full mb-6">
            <Sparkles size={14} className="text-blue-600" />
            <span className="text-[13px] font-semibold text-blue-700">
              Candidature basate sulle prove, non solo sui CV
            </span>
          </div>
          <h1 className="text-6xl max-w-[820px] mb-5">
            Prova il lavoro,<br />poi candidati.
          </h1>
          <p className="text-[20px] text-ink-600 leading-relaxed max-w-[600px] mb-8">
            Su Mansio completi le task reali del ruolo e dimostri cosa sai fare. Le aziende ti scelgono per
            le tue competenze, non per le parole nel curriculum.
          </p>
          <div className="flex gap-2.5 max-w-[720px] flex-wrap items-start">
            <div className="flex-[2_1_260px] relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ruolo, competenza o azienda"
                className="w-full pl-10 pr-4 py-2.5 border border-ink-200 rounded-lg text-[14px] text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-brand transition bg-white h-12"
              />
            </div>
            <Button size="lg" iconRight={<ArrowRight size={16} />}>Cerca</Button>
          </div>
          <div className="flex gap-2 mt-4 items-center flex-wrap">
            <span className="text-[13px] text-ink-500">Popolari:</span>
            {['Product Designer', 'Frontend', 'Data Analyst', 'Remoto'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setSearch(t)}
                className="text-[13px] font-medium px-2.5 py-1 rounded-md bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="max-w-container mx-auto px-6 py-14 w-full">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-[30px]">Offerte con simulazione</h2>
            <p className="text-[16px] text-ink-500 mt-1.5">
              {loading
                ? 'Caricamento…'
                : `${filtered.length} posizion${filtered.length === 1 ? 'e' : 'i'} · ognuna con task reali da completare`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-ink-200 p-5 animate-pulse">
                <div className="h-5 bg-ink-100 rounded w-40 mb-3" />
                <div className="h-3 bg-ink-100 rounded w-24 mb-4" />
                <div className="h-3 bg-ink-100 rounded w-full mb-2" />
                <div className="h-3 bg-ink-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink-500 text-[17px] font-semibold mb-1">
              {jobs.length === 0
                ? 'Nessuna posizione aperta al momento'
                : 'Nessuna offerta corrisponde alla ricerca'}
            </p>
            <p className="text-ink-400 text-[14px]">
              {jobs.length === 0 ? 'Torna a controllare presto.' : 'Prova con parole chiave diverse.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="max-w-container mx-auto px-6 pt-6 pb-20 w-full">
        <h2 className="text-[30px] mb-2">Come funziona</h2>
        <p className="text-[16px] text-ink-500 mb-9 max-w-[560px]">
          Tre passi per trasformare la tua candidatura in una prova concreta.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <HowStep
            n={1}
            Icon={Briefcase}
            title="Scegli un'offerta"
            text="Trovi posizioni reali con una simulazione collegata: vedi subito le task che dovrai affrontare."
          />
          <HowStep
            n={2}
            Icon={ClipboardCheck}
            title="Completa la simulazione"
            text="Affronti le stesse task del ruolo, nei tuoi tempi. Niente domande trabocchetto, solo lavoro vero."
          />
          <HowStep
            n={3}
            Icon={Award}
            title="Ricevi un feedback"
            text="L'azienda valuta il tuo lavoro e ti dà un riscontro. Le candidature migliori passano avanti."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
