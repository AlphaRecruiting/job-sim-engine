'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type AppData = {
  application?: {
    jobPosting?: { title?: string; description?: string; department?: string };
    candidate?: { name?: string; email?: string; phone?: string };
    id?: string;
  };
};
type CandidateProfile = { id: string; email: string; name?: string; phone?: string; avatarData?: string };

export default function ApplyPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [loggedInProfile, setLoggedInProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Fetch application data + try to load logged-in candidate profile
    Promise.all([
      api.get<AppData>(`/api/candidate/application/${token}`),
      loadCandidateProfile(),
    ]).then(([appData, profile]) => {
      setData(appData);
      if (profile) {
        setLoggedInProfile(profile);
        // Logged-in profile takes priority for pre-fill
        setName(profile.name ?? appData.application?.candidate?.name ?? '');
        setPhone(profile.phone ?? appData.application?.candidate?.phone ?? '');
      } else {
        setName(appData.application?.candidate?.name ?? '');
        setPhone(appData.application?.candidate?.phone ?? '');
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [token]);

  async function loadCandidateProfile(): Promise<CandidateProfile | null> {
    const t = typeof window !== 'undefined' ? localStorage.getItem('candidateToken') : null;
    if (!t) return null;
    try {
      const res = await fetch('/api/candidate/auth/me', { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  async function start() {
    setStarting(true);
    setError('');
    try {
      // Save profile back (candidate.ts endpoint or profile auth endpoint)
      const cToken = typeof window !== 'undefined' ? localStorage.getItem('candidateToken') : null;
      if (cToken && loggedInProfile) {
        // Update candidate profile account
        await fetch('/api/candidate/auth/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cToken}` },
          body: JSON.stringify({ name: name || undefined, phone: phone || undefined }),
        });
      }
      // Always save to the org-specific candidate record too
      if ((name && name !== data?.application?.candidate?.name) || (phone && phone !== data?.application?.candidate?.phone)) {
        await api.patch(`/api/candidate/application/${token}/profile`, { name: name || undefined, phone: phone || undefined });
      }
      const session = await api.post<{ sessionToken: string }>(`/api/candidate/application/${token}/start`);
      router.push(`/simulation/${session.sessionToken}`);
    } catch (e: any) { setError(e.message); } finally { setStarting(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Caricamento...</div>;
  if (!data?.application) return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Candidatura non trovata.'}</div>;

  const { jobPosting, candidate } = data.application;
  const email = loggedInProfile?.email ?? candidate?.email ?? '';
  const initials = (loggedInProfile?.name ?? name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-lg w-full overflow-hidden">

        {/* Job header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          {jobPosting?.department && <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">{jobPosting.department}</p>}
          <h1 className="text-2xl font-bold leading-tight">{jobPosting?.title}</h1>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Simulation brief */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Cosa ti aspetta</p>
            <p className="text-sm text-blue-800 leading-relaxed">Completerai una simulazione pratica del ruolo. Ogni step testa le competenze richieste. Non ci sono risposte giuste o sbagliate — mostraci come ragioni.</p>
          </div>

          {/* Candidate profile section */}
          <div className="space-y-3">
            {loggedInProfile ? (
              /* Logged-in candidate: show profile card */
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                {loggedInProfile.avatarData ? (
                  <img src={loggedInProfile.avatarData} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{loggedInProfile.name}</p>
                  <p className="text-xs text-gray-400 truncate">{loggedInProfile.email}</p>
                </div>
                <button
                  onClick={() => router.push('/candidate/profile')}
                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                >
                  Modifica
                </button>
              </div>
            ) : (
              /* Not logged in: show login prompt + manual fields */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">I tuoi dati</p>
                  <button
                    onClick={() => router.push(`/candidate/login?redirect=/apply/${token}`)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Hai già un account? Accedi →
                  </button>
                </div>

                {/* Email (read-only from invite) */}
                {email && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                      {email}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Nome e cognome</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Mario Rossi"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      Telefono <span className="text-gray-400 font-normal">(opzionale)</span>
                    </label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 333 1234567"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

          <button
            onClick={start}
            disabled={starting || (!loggedInProfile && !name.trim())}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
          >
            {starting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Avvio...</>
            ) : (
              <>Inizia la simulazione <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
            )}
          </button>
          {!loggedInProfile && !name.trim() && (
            <p className="text-xs text-center text-gray-400">Inserisci il tuo nome per continuare</p>
          )}
        </div>
      </div>
    </div>
  );
}
