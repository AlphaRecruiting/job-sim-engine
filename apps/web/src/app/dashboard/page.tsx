'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import TopNav from '@/components/TopNav';
import Footer from '@/components/Footer';
import { Button, Badge, Card, Avatar, Progress, Stat, Tabs } from '@/components/ui';

const APPS = [
  { id: 1, role: 'Product Designer',  company: 'Nuvola',    status: 'sim-progress', tasks: 2, total: 4, date: 'Aggiornata oggi' },
  { id: 2, role: 'Frontend Engineer', company: 'Acme Corp',  status: 'review',       tasks: 3, total: 3, date: 'Inviata 2 giorni fa' },
  { id: 3, role: 'Data Analyst',      company: 'Forma',      status: 'passed',       tasks: 5, total: 5, date: 'Feedback ricevuto' },
  { id: 4, role: 'Growth Marketer',   company: 'Salto',      status: 'invited',      tasks: 4, total: 4, date: 'Colloquio fissato' },
  { id: 5, role: 'Customer Success',  company: 'Nuvola',     status: 'closed',       tasks: 1, total: 3, date: 'Posizione chiusa' },
];

type Status = 'sim-progress' | 'review' | 'passed' | 'invited' | 'closed';

const STATUS_MAP: Record<Status, { tone: 'brand' | 'warning' | 'success' | 'neutral'; label: string }> = {
  'sim-progress': { tone: 'brand',    label: 'Simulazione in corso' },
  review:         { tone: 'warning',  label: 'In revisione' },
  passed:         { tone: 'success',  label: 'Simulazione superata' },
  invited:        { tone: 'success',  label: 'Invitato al colloquio' },
  closed:         { tone: 'neutral',  label: 'Chiusa' },
};

function AppRow({ app }: { app: typeof APPS[number] }) {
  const s = STATUS_MAP[app.status as Status];
  const tone: 'brand' | 'success' = app.status === 'passed' || app.status === 'invited' ? 'success' : 'brand';
  return (
    <Card padding="md" interactive>
      <div className="flex items-center gap-4">
        <Avatar name={app.company} square size="lg" />
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-bold text-ink-950 font-display">{app.role}</div>
          <div className="text-[14px] text-ink-500">{app.company} · {app.date}</div>
        </div>
        <div className="w-44 hidden sm:block">
          <Progress value={app.tasks} max={app.total} label={`${app.tasks}/${app.total} task`} tone={tone} showValue={false} />
        </div>
        <div className="hidden md:flex justify-end w-48">
          <Badge tone={s.tone} dot>{s.label}</Badge>
        </div>
        <ChevronRight size={17} className="text-ink-300 flex-none" />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState('attive');

  const filtered =
    tab === 'simulazioni'
      ? APPS.filter(a => a.status === 'sim-progress')
      : tab === 'salvati'
      ? APPS.slice(0, 2)
      : APPS;

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopNav />

      <div className="max-w-container mx-auto px-6 py-9 w-full flex-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar name="Giulia Romano" size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-[30px]">Ciao, Giulia</h1>
            <p className="text-[16px] text-ink-500 mt-1">Hai 2 simulazioni da completare e 1 feedback nuovo.</p>
          </div>
          <Link href="/">
            <Button iconLeft={<Search size={15} />}>Trova nuove offerte</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: '5',   label: 'Candidature attive' },
            { value: '11',  label: 'Task completate',    delta: { value: '3 questa settimana', dir: 'up' as const } },
            { value: '92%', label: 'Match medio',        delta: { value: '8%', dir: 'up' as const } },
            { value: '1',   label: 'Colloqui ottenuti' },
          ].map(s => (
            <Card key={s.label} padding="md">
              <Stat value={s.value} label={s.label} delta={s.delta} />
            </Card>
          ))}
        </div>

        {/* Tabs + list */}
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'attive',      label: 'Tutte',          count: APPS.length },
            { id: 'simulazioni', label: 'Da completare',  count: 1 },
            { id: 'salvati',     label: 'Salvati',         count: 2 },
          ]}
        />
        <div className="flex flex-col gap-3 mt-5">
          {filtered.length === 0 ? (
            <p className="text-ink-500 text-[15px] py-10 text-center">Nessuna candidatura in questa sezione.</p>
          ) : (
            filtered.map(a => <AppRow key={a.id} app={a} />)
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
