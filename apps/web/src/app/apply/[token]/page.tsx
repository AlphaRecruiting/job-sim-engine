'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type AppData = {
  type: string;
  application?: {
    jobPosting?: { title?: string; description?: string; department?: string };
    candidate?: { name?: string; email?: string; phone?: string };
    id?: string;
  };
};

export default function ApplyPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    api.get<AppData>(`/api/candidate/application/${token}`)
      .then(d => {
        setData(d);
        if (d.application?.candidate?.name) setName(d.application.candidate.name);
        if (d.application?.candidate?.phone) setPhone(d.application.candidate.phone);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function start() {
    setStarting(true);
    try {
      // Save profile updates if changed
      const candidate = data?.application?.candidate;
      if ((name && name !== candidate?.name) || (phone && phone !== candidate?.phone)) {
        await api.patch(`/api/candidate/application/${token}/profile`, { name: name || undefined, phone: phone || undefined });
      }
      const session = await api.post<{ sessionToken: string; currentStepId?: string }>(`/api/candidate/application/${token}/start`);
      router.push(`/simulation/${session.sessionToken}`);
    } catch (e: any) { setError(e.message); } finally { setStarting(false); }
  }

  if (loading) return <Loading />;
  if (error && !data) return <ErrorMsg message={error} />;
  if (!data?.application) return <ErrorMsg message="Application not found." />;

  const { jobPosting, candidate } = data.application;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-lg w-full overflow-hidden">
        {/* Job header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">{jobPosting?.department ?? 'Candidatura'}</p>
          <h1 className="text-2xl font-bold leading-tight">{jobPosting?.title}</h1>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Simulation info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Cosa ti aspetta</p>
            <p className="text-sm text-blue-800 leading-relaxed">Completerai una simulazione pratica del ruolo. Ogni step testa le competenze richieste per questa posizione. Non ci sono risposte giuste o sbagliate — mostraci come ragioni.</p>
          </div>

          {/* Candidate profile */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">I tuoi dati</p>

            {/* Email (read-only from invitation) */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                <span>{candidate?.email}</span>
              </div>
            </div>

            {/* Name (editable) */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Nome e cognome</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Mario Rossi"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Phone (editable) */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Numero di telefono <span className="text-gray-400 font-normal">(opzionale)</span></label>
              <input
                type="tel"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="+39 333 1234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

          <button
            onClick={start}
            disabled={starting || !name.trim()}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
          >
            {starting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Avvio in corso...</>
            ) : (
              <>Inizia la simulazione <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
            )}
          </button>
          {!name.trim() && <p className="text-xs text-center text-gray-400">Inserisci il tuo nome per continuare</p>}
        </div>
      </div>
    </div>
  );
}

function Loading() { return <div className="min-h-screen flex items-center justify-center text-gray-500">Caricamento...</div>; }
function ErrorMsg({ message }: { message: string }) { return <div className="min-h-screen flex items-center justify-center text-red-600">{message}</div>; }
