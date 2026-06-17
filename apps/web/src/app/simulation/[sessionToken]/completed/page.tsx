'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

type SessionRecord = {
  sessionToken: string;
  jobTitle: string;
  department?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalScore: number | null;
  recommendation: string | null;
  isCurrent: boolean;
};
type History = {
  candidate: { name?: string; email?: string; phone?: string };
  sessions: SessionRecord[];
};

const REC_LABELS: Record<string, { label: string; color: string }> = {
  strong_yes: { label: 'Ottimo candidato', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  yes: { label: 'Idoneo', color: 'text-green-700 bg-green-50 border-green-200' },
  maybe: { label: 'Da valutare', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  no: { label: 'Non idoneo', color: 'text-red-700 bg-red-50 border-red-200' },
  review_required: { label: 'Revisione manuale', color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

function scoreColor(s: number | null) {
  if (s === null) return 'text-gray-400';
  if (s >= 80) return 'text-emerald-600';
  if (s >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CompletedPage() {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<History>(`/api/candidate/sessions/${sessionToken}/history`)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [sessionToken]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Caricamento...</div>;

  const sessions = history?.sessions ?? [];
  const current = sessions.find(s => s.isCurrent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Completion hero */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Simulazione completata!</h1>
            {current && (
              <p className="text-gray-500 mt-1 text-sm">
                {current.jobTitle}{current.department ? ` · ${current.department}` : ''}
              </p>
            )}
          </div>
          {history?.candidate?.name && (
            <p className="text-sm text-gray-600">
              Ottimo lavoro, <strong>{history.candidate.name}</strong>. Il recruiter riceverà i tuoi risultati a breve.
            </p>
          )}
          {current?.totalScore != null && (
            <div className="inline-flex items-baseline gap-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-3">
              <span className={`text-4xl font-bold ${scoreColor(current.totalScore)}`}>{Math.round(current.totalScore)}</span>
              <span className="text-gray-400 text-sm font-normal">/100</span>
            </div>
          )}
          {current?.recommendation && REC_LABELS[current.recommendation] && (
            <div>
              <span className={`inline-block border rounded-full px-4 py-1 text-xs font-semibold ${REC_LABELS[current.recommendation].color}`}>
                {REC_LABELS[current.recommendation].label}
              </span>
            </div>
          )}
        </div>

        {/* All sessions */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Le tue candidature</h2>
                <p className="text-xs text-gray-400 mt-0.5">Storico delle simulazioni su questa piattaforma</p>
              </div>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{sessions.length}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {sessions.map(s => {
                const rec = s.recommendation ? REC_LABELS[s.recommendation] : null;
                return (
                  <div key={s.sessionToken} className={`px-6 py-4 flex items-center gap-4 ${s.isCurrent ? 'bg-blue-50/50' : ''}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${s.status === 'completed' ? 'bg-emerald-400' : s.status === 'in_progress' ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">{s.jobTitle}</span>
                        {s.isCurrent && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Appena completata</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.department && <>{s.department} · </>}
                        {s.status === 'completed' ? `Completata il ${fmt(s.completedAt)}` : s.status === 'in_progress' ? 'In corso' : `Iniziata il ${fmt(s.startedAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.totalScore != null && (
                        <span className={`text-sm font-bold ${scoreColor(s.totalScore)}`}>
                          {Math.round(s.totalScore)}<span className="text-gray-400 font-normal text-xs">/100</span>
                        </span>
                      )}
                      {rec && <span className={`hidden sm:inline text-[10px] border rounded-full px-2.5 py-0.5 font-semibold ${rec.color}`}>{rec.label}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Hai domande? Contatta direttamente il team HR dell'azienda.
        </p>
      </div>
    </div>
  );
}
