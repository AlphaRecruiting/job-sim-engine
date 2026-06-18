'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

type SessionInfo = {
  jobTitle: string;
  department?: string;
  isCurrent: boolean;
};
type History = {
  candidate: { name?: string };
  sessions: SessionInfo[];
};

export default function CompletedPage() {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const [history, setHistory] = useState<History | null>(null);

  useEffect(() => {
    api.get<History>(`/api/candidate/sessions/${sessionToken}/history`)
      .then(setHistory)
      .catch(() => {});
  }, [sessionToken]);

  const current = history?.sessions.find(s => s.isCurrent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center space-y-5">
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

        <p className="text-gray-600 text-sm leading-relaxed">
          {history?.candidate?.name ? (
            <>Ottimo lavoro, <strong>{history.candidate.name}</strong>! </>
          ) : (
            'Ottimo lavoro! '
          )}
          Il team HR riceverà i tuoi risultati e ti contatterà se il tuo profilo è in linea con la posizione.
        </p>

        <p className="text-xs text-gray-400">
          Hai domande? Contatta direttamente il team HR dell'azienda.
        </p>
      </div>
    </div>
  );
}
