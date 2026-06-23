'use client';
import { useEffect, useRef, useState } from 'react';
import { Building2, Globe, Users, Upload, X, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Alert } from '@/components/ui';

type OrgProfile = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  companyType?: string | null;
  website?: string | null;
  employeeCount?: string | null;
};

const COMPANY_TYPES = [
  { value: '', label: 'Seleziona tipologia...' },
  { value: 'startup', label: 'Startup' },
  { value: 'pmi', label: 'PMI' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'agency', label: 'Agenzia' },
  { value: 'consulting', label: 'Consulenza' },
  { value: 'nonprofit', label: 'Non profit' },
  { value: 'public', label: 'Pubblica amministrazione' },
  { value: 'other', label: 'Altro' },
];

const EMPLOYEE_COUNTS = [
  { value: '', label: 'Seleziona dimensione...' },
  { value: '1-10', label: '1–10 dipendenti' },
  { value: '11-50', label: '11–50 dipendenti' },
  { value: '51-200', label: '51–200 dipendenti' },
  { value: '201-500', label: '201–500 dipendenti' },
  { value: '501-1000', label: '501–1.000 dipendenti' },
  { value: '1000+', label: 'Oltre 1.000 dipendenti' },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[12px] text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    companyType: '',
    website: '',
    employeeCount: '',
    logoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<OrgProfile>('/api/organizations/current')
      .then(o => {
        setOrg(o);
        setForm({
          name: o.name ?? '',
          description: o.description ?? '',
          companyType: o.companyType ?? '',
          website: o.website ?? '',
          employeeCount: o.employeeCount ?? '',
          logoUrl: o.logoUrl ?? '',
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Il nome azienda è obbligatorio'); return; }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await api.patch<OrgProfile>('/api/organizations/current', form);
      setOrg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-ink-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-[28px]">Profilo azienda</h1>
        <p className="text-[15px] text-ink-500 mt-1">
          Queste informazioni vengono mostrate ai candidati durante la simulazione.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {error && <Alert tone="danger">{error}</Alert>}
        {saved && (
          <div className="flex items-center gap-2 text-[14px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="flex-none" />
            Profilo salvato con successo
          </div>
        )}

        {/* Logo + nome */}
        <div className="bg-white rounded-xl border border-ink-200 p-6 flex flex-col gap-5">
          <h2 className="text-[15px] font-bold text-ink-900 flex items-center gap-2">
            <Building2 size={16} className="text-ink-400" />
            Identità aziendale
          </h2>

          {/* Logo upload */}
          <Field label="Logo aziendale" hint="Carica un'immagine quadrata (PNG o JPG). Max 2 MB.">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-xl object-contain border border-ink-200 bg-ink-50 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 flex items-center justify-center flex-shrink-0">
                  <Building2 size={22} className="text-ink-300" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] text-ink-600 hover:border-ink-400 hover:bg-ink-50 transition bg-white">
                  <Upload size={13} />
                  {form.logoUrl ? 'Cambia logo' : 'Carica logo'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                    className="inline-flex items-center gap-1.5 text-[12px] text-ink-400 hover:text-danger transition"
                  >
                    <X size={12} />
                    Rimuovi
                  </button>
                )}
              </div>
            </div>
          </Field>

          {/* Nome azienda */}
          <Field label="Nome azienda">
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="es. Acme S.r.l."
              className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
            />
          </Field>

          {/* Descrizione */}
          <Field
            label="Descrizione"
            hint="Racconta brevemente cosa fa l'azienda, la sua missione e il settore in cui opera."
          >
            <textarea
              rows={4}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="es. Siamo una scaleup B2B che aiuta le medie imprese a digitalizzare i processi di vendita. Fondata nel 2019, oggi contiamo 80 persone distribuite in tutta Italia."
              className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none"
            />
          </Field>
        </div>

        {/* Dettagli */}
        <div className="bg-white rounded-xl border border-ink-200 p-6 flex flex-col gap-5">
          <h2 className="text-[15px] font-bold text-ink-900 flex items-center gap-2">
            <Users size={16} className="text-ink-400" />
            Dettagli
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipologia */}
            <Field label="Tipologia azienda">
              <select
                value={form.companyType}
                onChange={e => setForm(f => ({ ...f, companyType: e.target.value }))}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[14px] text-ink-900 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition bg-white"
              >
                {COMPANY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            {/* Dimensione */}
            <Field label="Dimensione">
              <select
                value={form.employeeCount}
                onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))}
                className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[14px] text-ink-900 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition bg-white"
              >
                {EMPLOYEE_COUNTS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Website */}
          <Field label="Sito web">
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://www.esempio.it"
                className="w-full border border-ink-200 rounded-lg pl-8 pr-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>
          </Field>
        </div>

        {/* Info sola lettura */}
        <div className="bg-ink-50 rounded-xl border border-ink-200 p-5">
          <p className="text-[12px] font-semibold text-ink-500 uppercase tracking-wider mb-3">Info account</p>
          <div className="flex flex-col gap-1.5 text-[13px] text-ink-500">
            <span>Slug: <span className="font-mono text-ink-700">{org?.slug}</span></span>
            <span>ID: <span className="font-mono text-ink-700">{org?.id}</span></span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>
      </form>
    </div>
  );
}
