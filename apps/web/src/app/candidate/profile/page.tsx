'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Profile = {
  id: string; email: string; name?: string; phone?: string; bio?: string;
  location?: string; linkedinUrl?: string; avatarData?: string; hasCv?: boolean; cvFilename?: string;
};

function authHeader() {
  const t = localStorage.getItem('candidateToken');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function CandidateProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('candidateToken');
    if (!token) { router.replace('/candidate/login?redirect=/candidate/profile'); return; }
    fetch('/api/candidate/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.error) { router.replace('/candidate/login?redirect=/candidate/profile'); return; }
        setProfile(d);
      }).finally(() => setLoading(false));
  }, [router]);

  async function save() {
    if (!profile) return;
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('candidateToken')!;
      const res = await fetch('/api/candidate/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, bio: profile.bio, location: profile.location, linkedinUrl: profile.linkedinUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data);
      localStorage.setItem('candidateProfile', JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function uploadAvatar(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      const token = localStorage.getItem('candidateToken')!;
      const res = await fetch('/api/candidate/auth/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data }),
      });
      const j = await res.json();
      setProfile(p => p ? { ...p, avatarData: j.avatarData } : p);
    };
    reader.readAsDataURL(file);
  }

  async function uploadCv(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      const token = localStorage.getItem('candidateToken')!;
      await fetch('/api/candidate/auth/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data, filename: file.name }),
      });
      setProfile(p => p ? { ...p, hasCv: true, cvFilename: file.name } : p);
    };
    reader.readAsDataURL(file);
  }

  function logout() {
    localStorage.removeItem('candidateToken');
    localStorage.removeItem('candidateProfile');
    router.push('/candidate/login');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Caricamento...</div>;
  if (!profile) return null;

  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Il tuo profilo</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 transition">Esci</button>
        </div>

        {/* Avatar + name hero */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {profile.avatarData ? (
              <img src={profile.avatarData} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-white shadow" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow">
                {initials}
              </div>
            )}
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition"
            >
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{profile.name ?? 'Candidato'}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            {profile.location && <p className="text-sm text-gray-500 mt-0.5">{profile.location}</p>}
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Informazioni personali</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome e cognome" value={profile.name ?? ''} onChange={v => setProfile(p => p ? { ...p, name: v } : p)} placeholder="Mario Rossi" />
            <Field label="Telefono" value={profile.phone ?? ''} onChange={v => setProfile(p => p ? { ...p, phone: v } : p)} placeholder="+39 333 1234567" />
            <Field label="Città / Posizione" value={profile.location ?? ''} onChange={v => setProfile(p => p ? { ...p, location: v } : p)} placeholder="Milano, Italia" />
            <Field label="LinkedIn" value={profile.linkedinUrl ?? ''} onChange={v => setProfile(p => p ? { ...p, linkedinUrl: v } : p)} placeholder="linkedin.com/in/mario-rossi" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Bio / Presentazione</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve presentazione di te stesso..."
              value={profile.bio ?? ''}
              onChange={e => setProfile(p => p ? { ...p, bio: e.target.value } : p)}
            />
          </div>
        </div>

        {/* CV upload */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Curriculum Vitae</h2>
          {profile.hasCv ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1.5H8V13zm0 3h5v1.5H8V16zm0-6h3v1.5H8V10z"/></svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{profile.cvFilename ?? 'cv.pdf'}</p>
                  <p className="text-xs text-green-600">Caricato ✓</p>
                </div>
              </div>
              <button onClick={() => cvRef.current?.click()} className="text-xs text-blue-600 hover:underline">Sostituisci</button>
            </div>
          ) : (
            <button
              onClick={() => cvRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50/30 transition group"
            >
              <svg className="w-8 h-8 text-gray-300 group-hover:text-blue-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
              <span className="text-sm text-gray-400 group-hover:text-blue-500 transition">Carica il tuo CV (PDF)</span>
            </button>
          )}
          <input ref={cvRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadCv(e.target.files[0])} />
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

        <button
          onClick={save} disabled={saving}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition text-sm"
        >
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato!' : 'Salva profilo'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1.5">{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
