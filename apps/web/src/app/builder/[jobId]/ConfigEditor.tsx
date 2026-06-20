'use client';
import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function uid() { return Math.random().toString(36).slice(2, 8); }

function ListInput({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-ink-500 uppercase tracking-wide mb-2">{label}</label>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }}
              placeholder={placeholder}
              className="flex-1 border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-ink-300 hover:text-danger transition-colors p-1"><Trash2 size={13} /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ''])}
          className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit">
          <Plus size={12} /> Aggiungi
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-ink-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition resize-y leading-relaxed" />
  );
}

function Inp({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" />
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-ink-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-ink-50 hover:bg-ink-100 transition-colors">
        <span className="text-[12px] font-bold text-ink-700 uppercase tracking-wide">{title}</span>
        {open ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
      </button>
      {open && <div className="px-4 py-4 flex flex-col gap-4">{children}</div>}
    </div>
  );
}

// ─── Multiple Choice ───────────────────────────────────────────────────────────
function MultipleChoiceEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const c = config as { question: string; options: { id: string; label: string; isCorrect: boolean }[]; allowMultiple: boolean };
  const set = (patch: Partial<typeof c>) => onChange({ ...c, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Domanda">
        <Textarea value={c.question ?? ''} onChange={v => set({ question: v })} placeholder="Scrivi la domanda situazionale..." rows={3} />
      </Section>

      <Section title="Opzioni di risposta">
        <div className="flex flex-col gap-2">
          {(c.options ?? []).map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <button type="button"
                onClick={() => set({ options: c.options.map((o, j) => j === i ? { ...o, isCorrect: !o.isCorrect } : c.allowMultiple ? o : { ...o, isCorrect: false }) })}
                className={`w-5 h-5 rounded flex-none border-2 transition-colors flex items-center justify-center ${opt.isCorrect ? 'bg-success border-success text-white' : 'border-ink-300'}`}>
                {opt.isCorrect && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
              </button>
              <input value={opt.label} onChange={e => set({ options: c.options.map((o, j) => j === i ? { ...o, label: e.target.value } : o) })}
                placeholder={`Opzione ${String.fromCharCode(65 + i)}`}
                className="flex-1 border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" />
              <button type="button" onClick={() => set({ options: c.options.filter((_, j) => j !== i) })}
                className="text-ink-300 hover:text-danger transition-colors p-1"><Trash2 size={13} /></button>
            </div>
          ))}
          <button type="button"
            onClick={() => set({ options: [...(c.options ?? []), { id: uid(), label: '', isCorrect: false }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit">
            <Plus size={12} /> Aggiungi opzione
          </button>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-700 cursor-pointer">
          <input type="checkbox" checked={c.allowMultiple ?? false} onChange={e => set({ allowMultiple: e.target.checked })}
            className="rounded border-ink-300 text-brand focus:ring-brand" />
          Permetti risposte multiple
        </label>
      </Section>
    </div>
  );
}

// ─── Free Text ────────────────────────────────────────────────────────────────
function FreeTextEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const c = config as { prompt: string; expectedSignals: string[]; redFlags: string[]; rubric: { key: string; label: string; maxScore: number; description: string }[] };
  const set = (patch: Partial<typeof c>) => onChange({ ...c, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Traccia / Prompt">
        <Textarea value={c.prompt ?? ''} onChange={v => set({ prompt: v })} placeholder="Descrivi cosa deve fare il candidato..." rows={4} />
      </Section>

      <Section title="Segnali attesi (corretti)" defaultOpen={false}>
        <ListInput label="" items={c.expectedSignals ?? []} onChange={v => set({ expectedSignals: v })} placeholder="es. propone un follow-up concreto" />
      </Section>

      <Section title="Red flag (negativi)" defaultOpen={false}>
        <ListInput label="" items={c.redFlags ?? []} onChange={v => set({ redFlags: v })} placeholder="es. risposta generica senza dati" />
      </Section>

      <Section title="Come l'AI valuterà la risposta" defaultOpen={false}>
        <p className="text-[12px] text-ink-500 -mt-1 mb-2">
          Definisci i criteri con cui l'AI assegnerà il punteggio. Ogni criterio ha un nome, un punteggio massimo e una descrizione di cosa viene valutato. Il candidato non vede questi criteri.
        </p>
        <div className="flex flex-col gap-3">
          {(c.rubric ?? []).map((r, i) => (
            <div key={r.key} className="border border-ink-200 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <input value={r.label} onChange={e => set({ rubric: c.rubric.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })}
                  placeholder="Nome criterio (es. Tono professionale)" className="flex-1 border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" />
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" value={r.maxScore} onChange={e => set({ rubric: c.rubric.map((x, j) => j === i ? { ...x, maxScore: Number(e.target.value) } : x) })}
                    className="w-16 border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" placeholder="25" />
                  <span className="text-[12px] text-ink-400">pt</span>
                </div>
                <button type="button" onClick={() => set({ rubric: c.rubric.filter((_, j) => j !== i) })} className="text-ink-300 hover:text-danger p-1"><Trash2 size={13} /></button>
              </div>
              <input value={r.description} onChange={e => set({ rubric: c.rubric.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })}
                placeholder="Cosa valuta questo criterio? (es. La risposta riconosce il problema del cliente?)" className="w-full border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" />
            </div>
          ))}
          <button type="button" onClick={() => set({ rubric: [...(c.rubric ?? []), { key: uid(), label: '', maxScore: 25, description: '' }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit">
            <Plus size={12} /> Aggiungi criterio
          </button>
        </div>
      </Section>
    </div>
  );
}

// ─── CRM Prioritization ───────────────────────────────────────────────────────
function CrmEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const c = config as any;
  const set = (patch: any) => onChange({ ...c, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Contesto scenario">
        <Textarea value={c.scenarioContext ?? ''} onChange={v => set({ scenarioContext: v })} placeholder="Descrivi la situazione (es. Sei un AE, è lunedì mattina...)" rows={3} />
        <Textarea value={c.taskPrompt ?? ''} onChange={v => set({ taskPrompt: v })} placeholder="Istruzione per il candidato (es. Prioritizza questi account...)" rows={2} />
      </Section>

      <Section title="Record CRM">
        <div className="flex flex-col gap-4">
          {(c.records ?? []).map((r: any, i: number) => (
            <div key={r.id} className="border border-ink-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wide">Record {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[12px] text-ink-600 cursor-pointer">
                    <input type="checkbox"
                      checked={(c.expectedTopRecordIds ?? []).includes(r.id)}
                      onChange={e => {
                        const ids = c.expectedTopRecordIds ?? [];
                        set({ expectedTopRecordIds: e.target.checked ? [...ids, r.id] : ids.filter((x: string) => x !== r.id) });
                      }}
                      className="rounded border-ink-300 text-brand" />
                    Top priority
                  </label>
                  <button type="button" onClick={() => set({ records: c.records.filter((_: any, j: number) => j !== i) })} className="text-ink-300 hover:text-danger p-1"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Nome contatto"><Inp value={r.displayName ?? ''} onChange={v => set({ records: c.records.map((x: any, j: number) => j === i ? { ...x, displayName: v } : x) })} placeholder="Mario Rossi" /></Field>
                <Field label="Azienda"><Inp value={r.company ?? ''} onChange={v => set({ records: c.records.map((x: any, j: number) => j === i ? { ...x, company: v } : x) })} placeholder="Acme Srl" /></Field>
                <Field label="Valore (€)"><Inp type="number" value={String(r.value ?? '')} onChange={v => set({ records: c.records.map((x: any, j: number) => j === i ? { ...x, value: Number(v) } : x) })} placeholder="50000" /></Field>
                <Field label="Stage CRM"><Inp value={r.stage ?? ''} onChange={v => set({ records: c.records.map((x: any, j: number) => j === i ? { ...x, stage: v } : x) })} placeholder="Negotiation" /></Field>
              </div>
              <Field label="Segnali visibili">
                <ListInput label="" items={r.visibleSignals ?? []} onChange={vs => set({ records: c.records.map((x: any, j: number) => j === i ? { ...x, visibleSignals: vs } : x) })} placeholder="es. Rinnovo urgente" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Priority score (0-100) 🔒">
                  <input type="number" min={0} max={100} value={r.hiddenPriorityScore ?? 50}
                    onChange={e => set({ records: c.records.map((x: any, j: number) => j === i ? { ...x, hiddenPriorityScore: Number(e.target.value) } : x) })}
                    className="w-full border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" />
                </Field>
                <Field label="Razionale nascosto 🔒"><Inp value={r.hiddenRationale ?? ''} onChange={v => set({ records: c.records.map((x: any, j: number) => j === i ? { ...x, hiddenRationale: v } : x) })} placeholder="Perché questo score" /></Field>
              </div>
            </div>
          ))}
          <button type="button"
            onClick={() => set({ records: [...(c.records ?? []), { id: uid(), displayName: '', company: '', value: 0, stage: '', notes: [], visibleSignals: [], hiddenPriorityScore: 50, hiddenRationale: '' }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit">
            <Plus size={12} /> Aggiungi record
          </button>
        </div>
      </Section>
    </div>
  );
}

// ─── Notification Reaction ────────────────────────────────────────────────────
const CHANNELS = ['slack', 'email', 'sms', 'system_alert', 'crm_alert'] as const;
const ACTIONS = ['reply', 'ignore', 'escalate', 'schedule_followup', 'create_task', 'ask_clarification'];

function NotificationEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const c = config as any;
  const set = (patch: any) => onChange({ ...c, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Contesto scenario">
        <Textarea value={c.scenarioContext ?? ''} onChange={v => set({ scenarioContext: v })} placeholder="Descrivi la situazione (es. Sono le 9:00 di martedì...)" rows={3} />
        <Textarea value={c.taskPrompt ?? ''} onChange={v => set({ taskPrompt: v })} placeholder="Cosa deve fare il candidato" rows={2} />
      </Section>

      <Section title="Notifiche">
        <div className="flex flex-col gap-4">
          {(c.notifications ?? []).map((n: any, i: number) => (
            <div key={n.id} className="border border-ink-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wide">Notifica {i + 1}</span>
                <button type="button" onClick={() => set({ notifications: c.notifications.filter((_: any, j: number) => j !== i) })} className="text-ink-300 hover:text-danger p-1"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Mittente"><Inp value={n.senderName ?? ''} onChange={v => set({ notifications: c.notifications.map((x: any, j: number) => j === i ? { ...x, senderName: v } : x) })} placeholder="Mario Rossi" /></Field>
                <Field label="Ruolo"><Inp value={n.senderRole ?? ''} onChange={v => set({ notifications: c.notifications.map((x: any, j: number) => j === i ? { ...x, senderRole: v } : x) })} placeholder="VP Sales" /></Field>
                <Field label="Canale">
                  <select value={n.channel ?? 'slack'} onChange={e => set({ notifications: c.notifications.map((x: any, j: number) => j === i ? { ...x, channel: e.target.value } : x) })}
                    className="w-full border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white transition">
                    {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </Field>
                <Field label="Urgenza nascosta 🔒 (0-100)">
                  <input type="number" min={0} max={100} value={n.hiddenUrgency ?? 50}
                    onChange={e => set({ notifications: c.notifications.map((x: any, j: number) => j === i ? { ...x, hiddenUrgency: Number(e.target.value) } : x) })}
                    className="w-full border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition" />
                </Field>
              </div>
              <Field label="Messaggio">
                <Textarea value={n.message ?? ''} onChange={v => set({ notifications: c.notifications.map((x: any, j: number) => j === i ? { ...x, message: v } : x) })} rows={2} placeholder="Testo della notifica..." />
              </Field>
              <Field label="Azioni attese 🔒">
                <div className="flex flex-wrap gap-1.5">
                  {ACTIONS.map(a => (
                    <button key={a} type="button"
                      onClick={() => {
                        const acts: string[] = n.expectedActionTypes ?? [];
                        set({ notifications: c.notifications.map((x: any, j: number) => j === i ? { ...x, expectedActionTypes: acts.includes(a) ? acts.filter((act: string) => act !== a) : [...acts, a] } : x) });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${(n.expectedActionTypes ?? []).includes(a) ? 'bg-brand text-white border-brand' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          ))}
          <button type="button"
            onClick={() => set({ notifications: [...(c.notifications ?? []), { id: uid(), senderName: '', senderRole: '', channel: 'slack', timestampOffsetMinutes: 0, message: '', hiddenUrgency: 50, hiddenImportance: 50, expectedActionTypes: [], hiddenRationale: '' }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit">
            <Plus size={12} /> Aggiungi notifica
          </button>
        </div>
      </Section>
    </div>
  );
}

// ─── Email Response ───────────────────────────────────────────────────────────
function EmailEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const c = config as any;
  const set = (patch: any) => onChange({ ...c, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Contesto">
        <Textarea value={c.scenarioContext ?? ''} onChange={v => set({ scenarioContext: v })} placeholder="Contesto della situazione..." rows={3} />
        <Textarea value={c.taskPrompt ?? ''} onChange={v => set({ taskPrompt: v })} placeholder="es. Rispondi a questa email in modo professionale..." rows={2} />
      </Section>

      <Section title="Thread email">
        <div className="flex flex-col gap-4">
          {(c.emailThread ?? []).map((e: any, i: number) => (
            <div key={e.id} className="border border-ink-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wide">Email {i + 1}</span>
                <button type="button" onClick={() => set({ emailThread: c.emailThread.filter((_: any, j: number) => j !== i) })} className="text-ink-300 hover:text-danger p-1"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Da"><Inp value={e.from ?? ''} onChange={v => set({ emailThread: c.emailThread.map((x: any, j: number) => j === i ? { ...x, from: v } : x) })} placeholder="cliente@company.com" /></Field>
                <Field label="Oggetto"><Inp value={e.subject ?? ''} onChange={v => set({ emailThread: c.emailThread.map((x: any, j: number) => j === i ? { ...x, subject: v } : x) })} placeholder="Oggetto email" /></Field>
              </div>
              <Field label="Corpo">
                <Textarea value={e.body ?? ''} onChange={v => set({ emailThread: c.emailThread.map((x: any, j: number) => j === i ? { ...x, body: v } : x) })} rows={5} placeholder="Testo dell'email..." />
              </Field>
            </div>
          ))}
          <button type="button"
            onClick={() => set({ emailThread: [...(c.emailThread ?? []), { id: uid(), from: '', to: [], timestamp: new Date().toISOString(), subject: '', body: '' }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit">
            <Plus size={12} /> Aggiungi email
          </button>
        </div>
      </Section>

      <Section title="Segnali attesi / Red flag" defaultOpen={false}>
        <ListInput label="Segnali positivi" items={c.expectedSignals ?? []} onChange={v => set({ expectedSignals: v })} placeholder="es. Propone un next step chiaro" />
        <ListInput label="Red flag" items={c.redFlags ?? []} onChange={v => set({ redFlags: v })} placeholder="es. Non si scusa per il disagio" />
      </Section>

      <Section title="Come l'AI valuterà la risposta email" defaultOpen={false}>
        <p className="text-[12px] text-ink-500 -mt-1 mb-2">
          Definisci i criteri con cui l'AI assegnerà il punteggio alla risposta. Il candidato non vede questi criteri — li usa solo l'AI per valutare.
        </p>
        <div className="flex flex-col gap-3">
          {(c.rubric ?? []).map((r: any, i: number) => (
            <div key={r.key} className="border border-ink-200 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <input value={r.label} onChange={e => set({ rubric: c.rubric.map((x: any, j: number) => j === i ? { ...x, label: e.target.value } : x) })}
                  placeholder="Nome criterio (es. Tono professionale)" className="flex-1 border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 transition" />
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" value={r.maxScore} onChange={e => set({ rubric: c.rubric.map((x: any, j: number) => j === i ? { ...x, maxScore: Number(e.target.value) } : x) })}
                    className="w-16 border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 transition" placeholder="25" />
                  <span className="text-[12px] text-ink-400">pt</span>
                </div>
                <button type="button" onClick={() => set({ rubric: c.rubric.filter((_: any, j: number) => j !== i) })} className="text-ink-300 hover:text-danger p-1"><Trash2 size={13} /></button>
              </div>
              <input value={r.description ?? ''} onChange={e => set({ rubric: c.rubric.map((x: any, j: number) => j === i ? { ...x, description: e.target.value } : x) })}
                placeholder="Cosa valuta? (es. La risposta riconosce il problema e propone una soluzione?)" className="w-full border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 transition" />
            </div>
          ))}
          <button type="button" onClick={() => set({ rubric: [...(c.rubric ?? []), { key: uid(), label: '', maxScore: 25, description: '' }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit"><Plus size={12} /> Aggiungi criterio</button>
        </div>
      </Section>
    </div>
  );
}

// ─── Simulated Call ───────────────────────────────────────────────────────────
const OBJECTION_TYPES = ['budget', 'timing', 'authority', 'need', 'trust', 'competition', 'implementation', 'risk', 'internal_resistance'];
const MOODS = ['friendly', 'neutral', 'skeptical', 'busy', 'frustrated'];
const IMPORTANCE = ['low', 'medium', 'high', 'critical'];

function SimulatedCallEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const c = config as any;
  const set = (patch: any) => onChange({ ...c, ...patch });
  const setPersona = (patch: any) => set({ aiPersona: { ...(c.aiPersona ?? {}), ...patch } });
  const setBuyer = (patch: any) => set({ hiddenBuyerState: { ...(c.hiddenBuyerState ?? {}), ...patch } });

  return (
    <div className="flex flex-col gap-4">
      <Section title="Brief per il candidato (pubblico)">
        <Textarea value={c.publicCandidateBrief ?? ''} onChange={v => set({ publicCandidateBrief: v })} rows={4} placeholder="Descrivi il contesto che il candidato vedrà prima della chiamata..." />
      </Section>

      <Section title="Persona AI (acquirente/interlocutore)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome"><Inp value={c.aiPersona?.name ?? ''} onChange={v => setPersona({ name: v })} placeholder="Alex Martinez" /></Field>
          <Field label="Ruolo"><Inp value={c.aiPersona?.role ?? ''} onChange={v => setPersona({ role: v })} placeholder="Head of Operations" /></Field>
          <Field label="Azienda (opzionale)"><Inp value={c.aiPersona?.company ?? ''} onChange={v => setPersona({ company: v })} placeholder="Acme Corp" /></Field>
          <Field label="Umore iniziale">
            <select value={c.aiPersona?.baselineMood ?? 'neutral'} onChange={e => setPersona({ baselineMood: e.target.value })}
              className="w-full border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white transition">
              {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Personalità">
          <Textarea value={c.aiPersona?.personality ?? ''} onChange={v => setPersona({ personality: v })} rows={2} placeholder="es. Analitico, va al sodo, non sopporta le vague..." />
        </Field>
        <Field label="Stile comunicativo">
          <Textarea value={c.aiPersona?.communicationStyle ?? ''} onChange={v => setPersona({ communicationStyle: v })} rows={2} placeholder="es. Diretto, conciso, interrompe se annoiato..." />
        </Field>
      </Section>

      <Section title="Stato nascosto acquirente 🔒">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Interesse iniziale', key: 'initialInterestLevel' },
            { label: 'Fiducia iniziale', key: 'initialTrustLevel' },
            { label: 'Urgenza iniziale', key: 'initialUrgencyLevel' },
          ].map(({ label, key }) => (
            <Field key={key} label={`${label} (0-100)`}>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={100} value={c.hiddenBuyerState?.[key] ?? 50}
                  onChange={e => setBuyer({ [key]: Number(e.target.value) })}
                  className="flex-1 accent-brand" />
                <span className="text-[13px] font-semibold text-ink-700 w-8 text-right">{c.hiddenBuyerState?.[key] ?? 50}</span>
              </div>
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Obiezioni nascoste 🔒" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          {(c.hiddenBuyerState?.hiddenObjections ?? []).map((obj: any, i: number) => (
            <div key={obj.id} className="border border-ink-200 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <select value={obj.type ?? 'budget'} onChange={e => setBuyer({ hiddenObjections: c.hiddenBuyerState.hiddenObjections.map((x: any, j: number) => j === i ? { ...x, type: e.target.value } : x) })}
                  className="border border-ink-200 rounded-lg px-2 py-1 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white">
                  {OBJECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" onClick={() => setBuyer({ hiddenObjections: c.hiddenBuyerState.hiddenObjections.filter((_: any, j: number) => j !== i) })} className="text-ink-300 hover:text-danger p-1"><Trash2 size={13} /></button>
              </div>
              <Inp value={obj.description ?? ''} onChange={v => setBuyer({ hiddenObjections: c.hiddenBuyerState.hiddenObjections.map((x: any, j: number) => j === i ? { ...x, description: v } : x) })} placeholder="Descrizione dell'obiezione" />
              <Inp value={obj.revealCondition ?? ''} onChange={v => setBuyer({ hiddenObjections: c.hiddenBuyerState.hiddenObjections.map((x: any, j: number) => j === i ? { ...x, revealCondition: v } : x) })} placeholder="Condizione per rivelare (es. se candidato chiede del budget)" />
            </div>
          ))}
          <button type="button"
            onClick={() => setBuyer({ hiddenObjections: [...(c.hiddenBuyerState?.hiddenObjections ?? []), { id: uid(), type: 'budget', description: '', revealCondition: '', resolutionCondition: '', severity: 'medium' }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit"><Plus size={12} /> Aggiungi obiezione</button>
        </div>
      </Section>

      <Section title="Criteri d'acquisto 🔒" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          {(c.hiddenBuyerState?.buyingCriteria ?? []).map((cr: any, i: number) => (
            <div key={cr.id} className="flex gap-2">
              <input value={cr.criterion ?? ''} onChange={e => setBuyer({ buyingCriteria: c.hiddenBuyerState.buyingCriteria.map((x: any, j: number) => j === i ? { ...x, criterion: e.target.value } : x) })}
                placeholder="Criterio d'acquisto" className="flex-1 border border-ink-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/20 transition" />
              <select value={cr.importance ?? 'medium'} onChange={e => setBuyer({ buyingCriteria: c.hiddenBuyerState.buyingCriteria.map((x: any, j: number) => j === i ? { ...x, importance: e.target.value } : x) })}
                className="border border-ink-200 rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white">
                {IMPORTANCE.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <button type="button" onClick={() => setBuyer({ buyingCriteria: c.hiddenBuyerState.buyingCriteria.filter((_: any, j: number) => j !== i) })} className="text-ink-300 hover:text-danger p-1"><Trash2 size={13} /></button>
            </div>
          ))}
          <button type="button"
            onClick={() => setBuyer({ buyingCriteria: [...(c.hiddenBuyerState?.buyingCriteria ?? []), { id: uid(), criterion: '', importance: 'medium' }] })}
            className="flex items-center gap-1.5 text-[12px] text-brand font-semibold hover:underline w-fit"><Plus size={12} /> Aggiungi criterio</button>
        </div>
      </Section>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ConfigEditor({ type, config, onChange }: { type: string; config: any; onChange: (c: any) => void }) {
  switch (type) {
    case 'multiple_choice':       return <MultipleChoiceEditor config={config} onChange={onChange} />;
    case 'free_text':             return <FreeTextEditor config={config} onChange={onChange} />;
    case 'crm_prioritization':    return <CrmEditor config={config} onChange={onChange} />;
    case 'notification_reaction': return <NotificationEditor config={config} onChange={onChange} />;
    case 'email_response':        return <EmailEditor config={config} onChange={onChange} />;
    case 'simulated_call':        return <SimulatedCallEditor config={config} onChange={onChange} />;
    default:                      return <p className="text-[13px] text-ink-400">Nessun editor disponibile per questo tipo di step.</p>;
  }
}
