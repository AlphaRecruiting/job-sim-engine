'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

type Submission = {
  id: string;
  stepId: string;
  stepType: string;
  status: string;
  answer: any;
  score: any;
  scoringStatus: string;
  submittedAt?: string;
};

type Result = {
  result: { totalScore?: number; recommendation?: string; skillScores?: Record<string, number>; redFlags?: any[]; summary?: string };
  submissions: Submission[];
  events: Array<{ id: string; eventType: string; stepId?: string; createdAt: string }>;
};

const STEP_LABELS: Record<string, string> = {
  multiple_choice:       'Scelta multipla',
  free_text:             'Testo libero',
  crm_prioritization:    'Prioritizzazione CRM',
  notification_reaction: 'Reazione notifiche',
  email_response:        'Risposta email',
  simulated_call:        'Chiamata simulata',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completato',
  pending:   'In attesa',
  started:   'Avviato',
  skipped:   'Saltato',
  timeout:   'Scaduto',
};

const SCORING_LABELS: Record<string, string> = {
  scored:  'Valutato',
  pending: 'In corso',
  failed:  'Errore',
  skipped: 'Saltato',
};

const REC_LABELS: Record<string, string> = {
  strong_yes:      'Altamente idoneo',
  yes:             'Idoneo',
  maybe:           'Da valutare',
  no:              'Non idoneo',
  review_required: 'Richiede revisione',
};

const EVENT_LABELS: Record<string, string> = {
  session_started:   'Sessione avviata',
  session_completed: 'Sessione completata',
  step_started:      'Step avviato',
  step_completed:    'Step completato',
  step_skipped:      'Step saltato',
  step_timeout:      'Step scaduto',
  scoring_started:   'Valutazione avviata',
  scoring_completed: 'Valutazione completata',
};

const recColor: Record<string, string> = {
  strong_yes: 'text-green-700', yes: 'text-blue-700',
  maybe: 'text-yellow-700', no: 'text-red-700', review_required: 'text-orange-700',
};

function labelFor(map: Record<string, string>, key: string): string {
  return map[key] ?? key.replace(/_/g, ' ');
}

function AnswerView({ stepType, answer }: { stepType: string; answer: any }) {
  if (!answer) return null;

  if (stepType === 'free_text') {
    const text: string = answer.text ?? answer.response ?? '';
    if (!text) return null;
    return (
      <div className="mt-3 bg-ink-50 rounded-lg p-4 text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
        {text}
      </div>
    );
  }

  if (stepType === 'email_response') {
    const subject: string = answer.subject ?? '';
    const body: string = answer.body ?? answer.text ?? '';
    if (!subject && !body) return null;
    return (
      <div className="mt-3 bg-ink-50 rounded-lg border border-gray-100 overflow-hidden text-[13px]">
        {subject && (
          <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
            <span className="text-gray-400 shrink-0">Oggetto:</span>
            <span className="font-medium text-gray-800">{subject}</span>
          </div>
        )}
        {body && (
          <div className="px-4 py-3 text-gray-700 leading-relaxed whitespace-pre-wrap">{body}</div>
        )}
      </div>
    );
  }

  if (stepType === 'multiple_choice') {
    const selected: string[] = answer.selectedOptionIds ?? (answer.selectedOptionId ? [answer.selectedOptionId] : []);
    if (!selected.length) return null;
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {selected.map((id: string) => (
          <span key={id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[12px] font-semibold px-2.5 py-1 rounded-md">
            ✓ {id}
          </span>
        ))}
      </div>
    );
  }

  if (stepType === 'crm_prioritization') {
    const items: any[] = answer.rankedItems ?? answer.orderedRecords ?? [];
    const explanation: string = answer.explanation ?? '';
    if (!items.length && !explanation) return null;
    return (
      <div className="mt-3 space-y-3">
        {items.length > 0 && (
          <div className="space-y-1">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-[13px]">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold shrink-0">{i + 1}</span>
                <span className="text-gray-800">{item.name ?? item.company ?? item.id ?? String(item)}</span>
                {item.reason && <span className="text-gray-400 text-[12px]">— {item.reason}</span>}
              </div>
            ))}
          </div>
        )}
        {explanation && (
          <div className="bg-ink-50 rounded-lg p-3 text-[13px] text-gray-700 leading-relaxed border border-gray-100">
            <span className="text-gray-400 text-[12px] block mb-1">Spiegazione</span>
            {explanation}
          </div>
        )}
      </div>
    );
  }

  if (stepType === 'notification_reaction') {
    const actions: any[] = answer.actions ?? answer.reactions ?? [];
    if (!actions.length) return null;
    const ACTION_LABELS: Record<string, string> = {
      reply:              'Risposta inviata',
      ignore:             'Ignorata',
      escalate:           'Escalation',
      schedule_followup:  'Follow-up pianificato',
      create_task:        'Task creata',
    };
    return (
      <div className="mt-3 space-y-2">
        {actions.map((a: any, i: number) => (
          <div key={i} className="flex items-start gap-3 text-[13px] bg-ink-50 rounded-lg p-3 border border-gray-100">
            <span className="font-semibold text-gray-700 shrink-0">{ACTION_LABELS[a.action] ?? a.action}</span>
            {a.note && <span className="text-gray-500">— {a.note}</span>}
            {a.response && <span className="text-gray-600 whitespace-pre-wrap">{a.response}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (stepType === 'simulated_call') {
    const transcript: any[] = answer.transcript ?? [];
    if (!transcript.length) return null;
    return (
      <details className="mt-3">
        <summary className="text-[12px] text-blue-600 cursor-pointer hover:underline select-none">
          Mostra trascrizione ({transcript.length} turni)
        </summary>
        <div className="mt-2 space-y-2 max-h-72 overflow-auto bg-ink-50 rounded-lg p-3 border border-gray-100">
          {transcript.map((t: any, i: number) => (
            <div key={i} className={`text-[12px] ${t.speaker === 'candidate' ? 'text-blue-800' : 'text-gray-600'}`}>
              <span className="font-semibold uppercase text-[11px] mr-1">
                {t.speaker === 'candidate' ? 'Candidato' : 'Interlocutore'}:
              </span>
              {t.text}
            </div>
          ))}
        </div>
      </details>
    );
  }

  return null;
}

export default function CandidateDetailPage() {
  const { sessionId } = useParams<{ candidateId: string; sessionId: string }>();
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<Result>(`/api/sessions/${sessionId}/result`).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="text-gray-500">Caricamento...</div>;
  if (!data) return <div className="text-red-600">Impossibile caricare i risultati.</div>;

  const { result, submissions, events } = data;

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Risultato candidato</h1>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600">{result.totalScore != null ? `${result.totalScore}%` : '—'}</div>
          <div className="text-sm text-gray-500 mt-1">Punteggio totale</div>
        </div>
        <div className="border-l border-gray-200 pl-8">
          <div className={`text-xl font-bold ${recColor[result.recommendation ?? ''] ?? 'text-gray-700'}`}>
            {result.recommendation ? labelFor(REC_LABELS, result.recommendation) : '—'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Raccomandazione</div>
          {result.summary && <p className="text-sm text-gray-600 mt-3">{result.summary}</p>}
        </div>
        {result.skillScores && Object.keys(result.skillScores).length > 0 && (
          <div className="border-l border-gray-200 pl-8 flex-1">
            <div className="text-sm font-medium text-gray-700 mb-2">Punteggi per competenza</div>
            {Object.entries(result.skillScores).map(([skill, score]) => (
              <div key={skill} className="flex items-center gap-2 mb-1">
                <div className="text-xs text-gray-600 w-36 truncate">{skill}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${score}%` }} />
                </div>
                <div className="text-xs font-medium w-8 text-right">{score}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Red flags */}
      {result.redFlags && result.redFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 mb-2">Segnali critici</h3>
          {result.redFlags.map((f: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-red-600">
              <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded ${f.severity === 'high' ? 'bg-red-200' : f.severity === 'medium' ? 'bg-orange-200 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {f.severity}
              </span>
              <span>{f.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step submissions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 font-semibold">Risultati per step</div>
        <div className="divide-y divide-gray-100">
          {submissions.map(sub => {
            const open = expanded.has(sub.id);
            return (
              <div key={sub.id} className="px-5 py-4">
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                      {labelFor(STEP_LABELS, sub.stepType)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{labelFor(STATUS_LABELS, sub.status)}</span>
                    {sub.submittedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(sub.submittedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{sub.score?.totalScore != null ? `${sub.score.totalScore}%` : '—'}</div>
                      <div className="text-xs text-gray-400">{labelFor(SCORING_LABELS, sub.scoringStatus)}</div>
                    </div>
                    {/* Toggle answer */}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(sub.id)}
                      className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline transition-colors"
                    >
                      {open ? 'Nascondi risposta' : 'Vedi risposta'}
                    </button>
                  </div>
                </div>

                {/* AI review */}
                {sub.score?.summary && (
                  <p className="text-sm text-gray-600 mt-1 mb-2 italic">"{sub.score.summary}"</p>
                )}
                {sub.score?.criteria && sub.score.criteria.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {sub.score.criteria.map((c: any) => (
                      <div key={c.key} className="flex items-start gap-3 text-xs">
                        <span className="text-gray-500 w-36 shrink-0">{c.label}</span>
                        <span className="font-semibold text-gray-800">{c.score}/{c.maxScore}</span>
                        {c.evidence && <span className="text-gray-400">{c.evidence}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Candidate answer — shown when expanded */}
                {open && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Risposta del candidato</div>
                    <AnswerView stepType={sub.stepType} answer={sub.answer} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold mb-3">Timeline sessione</h3>
        <div className="space-y-1 max-h-48 overflow-auto">
          {events.map(evt => (
            <div key={evt.id} className="flex items-center gap-3 text-xs text-gray-600">
              <span className="text-gray-400 w-40 shrink-0">{new Date(evt.createdAt).toLocaleTimeString()}</span>
              <span>{labelFor(EVENT_LABELS, evt.eventType)}</span>
              {evt.stepId && <span className="text-gray-400">step:{evt.stepId.slice(-6)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
