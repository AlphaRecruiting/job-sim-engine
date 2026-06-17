'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

type CandidateProfile = { id: string; email: string; name?: string; phone?: string; avatarData?: string };

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contratto', internship: 'Stage',
};
const REMOTE_LABELS: Record<string, string> = {
  remote: '🌐 Remoto', hybrid: '🏠 Ibrido', onsite: '🏢 In sede',
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);

  useEffect(() => {
    fetch(`/api/public/jobs/${jobId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setJob(data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // try to load logged-in candidate profile
    const token = localStorage.getItem('candidateToken');
    if (token) {
      fetch('/api/candidate/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p && !p.error) { setCandidateProfile(p); setName(p.name ?? ''); setEmail(p.email ?? ''); } })
        .catch(() => {});
    }
  }, [jobId]);

  async function handleApply(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    setApplying(true);
    try {
      const res = await fetch(`/api/public/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Candidatura non riuscita.'); return; }
      router.push(`/apply/${data.applicationToken}`);
    } catch {
      setError('Errore di rete — riprova.');
    } finally {
      setApplying(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400">Caricamento…</div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">Questa posizione non è più disponibile.</p>
      <Link href="/" className="text-indigo-600 text-sm hover:underline">← Torna alle offerte</Link>
    </div>
  );

  const initials = (candidateProfile?.name ?? name).split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">JS</span>
          </div>
          <span className="font-semibold text-slate-900">JobSim</span>
        </Link>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Tutte le offerte
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-6 py-10">
        {/* Job header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-5">
          <p className="text-sm text-indigo-600 font-semibold mb-2">{job.organization.name}</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{job.title}</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {job.department && <Tag>{job.department}</Tag>}
            {job.seniority && <Tag>{job.seniority}</Tag>}
            {job.employmentType && <Tag>{EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType}</Tag>}
            {job.location && <Tag>📍 {job.location}</Tag>}
            {job.remotePolicy && <Tag>{REMOTE_LABELS[job.remotePolicy] ?? job.remotePolicy}</Tag>}
          </div>
          <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">{job.description}</p>
        </div>

        {/* Simulation notice */}
        {job.activeSimulationVersionId && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-5 flex gap-3">
            <span className="text-xl shrink-0">🎯</span>
            <div>
              <p className="font-semibold text-indigo-900 text-sm mb-1">Simulazione lavorativa inclusa</p>
              <p className="text-indigo-700 text-sm leading-relaxed">
                Niente lettera di presentazione. Completerai task realistici del ruolo — l&apos;azienda vedrà direttamente come lavori.
              </p>
            </div>
          </div>
        )}

        {/* Apply section */}
        {candidateProfile ? (
          /* Logged-in candidate: one-click apply */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="font-semibold text-slate-900 text-lg mb-5">Candidati con il tuo profilo</h2>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              {candidateProfile.avatarData ? (
                <img src={candidateProfile.avatarData} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base font-bold text-white shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{candidateProfile.name}</p>
                <p className="text-xs text-slate-400 truncate">{candidateProfile.email}</p>
              </div>
              <Link href="/candidate/profile" className="text-xs text-indigo-600 hover:underline shrink-0">Modifica</Link>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
            <button
              onClick={() => handleApply()}
              disabled={applying}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              {applying
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Avvio candidatura…</>
                : 'Candidati ora'}
            </button>
          </div>
        ) : !showForm ? (
          /* Guest: prompt */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <h2 className="font-semibold text-slate-900 text-lg mb-2">Interessato a questo ruolo?</h2>
            <p className="text-slate-500 text-sm mb-6">Candidati in meno di un minuto — nessuna lettera di presentazione richiesta.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
              >
                Candidati ora
              </button>
              <Link
                href={`/candidate/login?redirect=/jobs/${jobId}`}
                className="border border-slate-200 text-slate-700 font-medium px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Accedi per auto-compilare
              </Link>
            </div>
          </div>
        ) : (
          /* Guest: form */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900 text-lg">I tuoi dati</h2>
              <Link href={`/candidate/login?redirect=/jobs/${jobId}`} className="text-xs text-indigo-600 hover:underline">
                Hai un account? Accedi →
              </Link>
            </div>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome e cognome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Mario Rossi" required
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Indirizzo email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@email.com" required
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm">
                  Indietro
                </button>
                <button type="submit" disabled={applying}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">
                  {applying ? 'Invio…' : 'Invia candidatura'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
      {children}
    </span>
  );
}
