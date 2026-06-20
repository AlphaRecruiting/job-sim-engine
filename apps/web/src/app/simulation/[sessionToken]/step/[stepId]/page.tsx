'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type StepData = {
  step: { id: string; type: string; title: string; instructions: string; timeLimitSeconds?: number; publicConfig: any };
  stepIndex: number;
  totalSteps: number;
  submission?: { status: string } | null;
  autosavedAnswer?: any;
};

export default function StepPage() {
  const { sessionToken, stepId } = useParams<{ sessionToken: string; stepId: string }>();
  const router = useRouter();
  const [data, setData] = useState<StepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // timeLeft is kept for internal auto-submit only — not displayed
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get<StepData>(`/api/candidate/sessions/${sessionToken}/steps/${stepId}`)
      .then(d => {
        setData(d);
        if (d.autosavedAnswer) setAnswer(d.autosavedAnswer);
        if (d.step.timeLimitSeconds) setTimeLeft(d.step.timeLimitSeconds);
      })
      .catch(e => setError(e.message)).finally(() => setLoading(false));

    api.post(`/api/candidate/sessions/${sessionToken}/steps/${stepId}/events`, { eventType: 'step_started' }).catch(() => {});
  }, [sessionToken, stepId]);

  // Internal timer — auto-submits when time is up, not shown to candidate
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(t => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      if (answer) api.post(`/api/candidate/sessions/${sessionToken}/steps/${stepId}/autosave`, { answer }).catch(() => {});
    }, 8000);
    return () => { if (autosaveRef.current) clearInterval(autosaveRef.current); };
  }, [answer, sessionToken, stepId]);

  async function handleSubmit() {
    if (submitting || !answer) return;
    setSubmitting(true);
    try {
      const result = await api.post<{ nextStepId?: string }>(`/api/candidate/sessions/${sessionToken}/steps/${stepId}/submit`, { answer });
      if (result.nextStepId) {
        router.push(`/simulation/${sessionToken}/step/${result.nextStepId}`);
      } else {
        await api.post(`/api/candidate/sessions/${sessionToken}/complete`);
        router.push(`/simulation/${sessionToken}/completed`);
      }
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  }

  const trackEvent = useCallback((eventType: string, payload?: unknown) => {
    api.post(`/api/candidate/sessions/${sessionToken}/steps/${stepId}/events`, { eventType, payload }).catch(() => {});
  }, [sessionToken, stepId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Caricamento...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!data) return null;

  const { step, stepIndex, totalSteps } = data;
  const alreadySubmitted = data.submission?.status === 'submitted';
  const progress = totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with progress */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-900 text-sm truncate">{step.title}</h1>
            <p className="text-xs text-gray-400 capitalize">{step.type.replace(/_/g, ' ')}</p>
          </div>
          {/* Step counter */}
          <div className="flex-shrink-0 text-right">
            <span className="text-sm font-bold text-gray-700">{stepIndex}</span>
            <span className="text-sm text-gray-400">/{totalSteps}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="px-6 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-shrink-0 rounded-full transition-all duration-300 ${
                i < stepIndex - 1 ? 'w-2 h-2 bg-blue-500' :
                i === stepIndex - 1 ? 'w-3 h-3 bg-blue-600 ring-2 ring-blue-200' :
                'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">{step.instructions}</p>
        </div>

        {alreadySubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="font-semibold text-green-700">Step completato</p>
          </div>
        ) : (
          <>
            <StepRenderer type={step.type} config={step.publicConfig} answer={answer} onAnswerChange={setAnswer} onTrackEvent={trackEvent} />

            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">Step {stepIndex} di {totalSteps}</span>
              <button
                onClick={handleSubmit}
                disabled={submitting || (!answer && step.type !== 'welcome')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition flex items-center gap-2 text-sm"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Invio...</>
                ) : step.type === 'welcome' ? (
                  <>Continua <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
                ) : (
                  <>Avanti {stepIndex < totalSteps ? `(${stepIndex + 1}/${totalSteps})` : '— Completa'} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Step renderers ---

function StepRenderer({ type, config, answer, onAnswerChange, onTrackEvent }: { type: string; config: any; answer: any; onAnswerChange: (a: any) => void; onTrackEvent: (e: string, p?: any) => void }) {
  switch (type) {
    case 'multiple_choice': return <MultipleChoiceRenderer config={config} answer={answer} onChange={onAnswerChange} />;
    case 'free_text': return <FreeTextRenderer config={config} answer={answer} onChange={onAnswerChange} />;
    case 'email_response': return <EmailResponseRenderer config={config} answer={answer} onChange={onAnswerChange} />;
    case 'crm_prioritization': return <CrmPrioritizationRenderer config={config} answer={answer} onChange={onAnswerChange} onTrackEvent={onTrackEvent} />;
    case 'notification_reaction': return <NotificationReactionRenderer config={config} answer={answer} onChange={onAnswerChange} />;
    case 'simulated_call': return <SimulatedCallRenderer config={config} answer={answer} onChange={onAnswerChange} onTrackEvent={onTrackEvent} />;
    case 'welcome': return <WelcomeRenderer config={config} answer={answer} onChange={onAnswerChange} />;
    case 'spreadsheet_edit': return <SpreadsheetEditRenderer config={config} answer={answer} onChange={onAnswerChange} />;
    default: return <div className="text-gray-500">Unknown step type: {type}</div>;
  }
}

function MultipleChoiceRenderer({ config, answer, onChange }: any) {
  const selected: string[] = answer?.selectedOptionIds ?? [];
  function toggle(id: string) {
    if (config.allowMultiple) {
      onChange({ selectedOptionIds: selected.includes(id) ? selected.filter((s: string) => s !== id) : [...selected, id] });
    } else {
      onChange({ selectedOptionIds: [id] });
    }
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <p className="font-medium">{config.question}</p>
      <div className="space-y-2">
        {config.options?.map((opt: any) => (
          <button key={opt.id} onClick={() => toggle(opt.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition ${selected.includes(opt.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-${config.allowMultiple ? 'sm' : 'full'} border-2 flex-shrink-0 ${selected.includes(opt.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
              <span className="text-sm">{opt.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FreeTextRenderer({ config, answer, onChange }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
      <p className="font-medium text-sm">{config.prompt}</p>
      <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write your response here..."
        value={answer?.text ?? ''}
        onChange={e => onChange({ text: e.target.value })} />
      {config.minWords && <p className="text-xs text-gray-400">Minimum {config.minWords} words</p>}
    </div>
  );
}

function EmailResponseRenderer({ config, answer, onChange }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {config.emailThread?.map((email: any) => (
        <div key={email.id} className="border border-gray-200 rounded-xl p-4 text-sm space-y-2">
          <div className="flex gap-4 text-xs text-gray-500">
            <span><strong>From:</strong> {email.from}</span>
            <span><strong>Subject:</strong> {email.subject}</span>
          </div>
          <p className="whitespace-pre-wrap text-gray-700">{email.body}</p>
        </div>
      ))}
      <div className="space-y-2 pt-2">
        <p className="text-sm font-medium text-gray-700">{config.taskPrompt}</p>
        <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Subject line..." value={answer?.subject ?? ''} onChange={e => onChange({ ...answer, subject: e.target.value })} />
        <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm min-h-[200px]" placeholder="Write your reply..." value={answer?.body ?? ''} onChange={e => onChange({ ...answer, body: e.target.value })} />
      </div>
    </div>
  );
}

function CrmPrioritizationRenderer({ config, answer, onChange, onTrackEvent }: any) {
  const ordered: string[] = answer?.orderedRecordIds ?? config.records?.map((r: any) => r.id) ?? [];
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragIdxRef = useRef<number | null>(null);

  const recordMap = new Map((config.records ?? []).map((r: any) => [r.id, r]));

  function reorder(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const newArr = [...ordered];
    const [item] = newArr.splice(fromIdx, 1);
    newArr.splice(toIdx, 0, item);
    onChange({ orderedRecordIds: newArr, explanation: answer?.explanation ?? '' });
    onTrackEvent('item_reordered', { id: ordered[fromIdx], from: fromIdx, to: toIdx });
  }

  function onDragStart(e: React.DragEvent, idx: number) {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  }

  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdxRef.current !== null) reorder(dragIdxRef.current, idx);
    dragIdxRef.current = null;
    setDragOverIdx(null);
  }

  function onDragEnd() {
    dragIdxRef.current = null;
    setDragOverIdx(null);
  }

  const priorityColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-blue-400',
    'bg-slate-400',
    'bg-slate-300',
    'bg-slate-300',
    'bg-slate-300',
    'bg-slate-300',
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-gray-700 leading-relaxed">{config.scenarioContext}</p>
        <p className="font-semibold text-sm text-gray-900 mt-2">{config.taskPrompt}</p>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
        Drag to reorder by priority
      </p>

      <div className="space-y-2">
        {ordered.map((id, i) => {
          const rec = recordMap.get(id) as any;
          if (!rec) return null;
          const isDragOver = dragOverIdx === i;
          const isDragging = dragIdxRef.current === i;
          return (
            <div
              key={id}
              draggable
              onDragStart={e => onDragStart(e, i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={e => onDrop(e, i)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing select-none
                ${isDragOver
                  ? 'border-blue-400 bg-blue-50 shadow-md scale-[1.01]'
                  : isDragging
                  ? 'border-dashed border-gray-300 bg-gray-50 opacity-40'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
            >
              {/* Drag handle */}
              <div className="flex flex-col gap-[3px] px-1 flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors">
                {[0,1,2].map(row => (
                  <div key={row} className="flex gap-[3px]">
                    <div className="w-[3px] h-[3px] rounded-full bg-current" />
                    <div className="w-[3px] h-[3px] rounded-full bg-current" />
                  </div>
                ))}
              </div>

              {/* Rank badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${priorityColors[i] ?? 'bg-slate-300'}`}>
                {i + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{rec.displayName}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {rec.company}
                  {rec.stage ? <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium">{rec.stage}</span> : null}
                </div>
                {rec.visibleSignals?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {rec.visibleSignals.map((s: string, si: number) => (
                      <span key={si} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Value badge */}
              {rec.value ? (
                <div className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0">
                  €{(rec.value / 1000).toFixed(0)}k
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {config.requiredExplanation && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 block">Explain your ranking</label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[110px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
            placeholder="Why did you prioritize these leads in this order? What signals influenced your decision?"
            value={answer?.explanation ?? ''}
            onChange={e => onChange({ orderedRecordIds: ordered, ...answer, explanation: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

function NotificationReactionRenderer({ config, answer, onChange }: any) {
  const actions: Record<string, any> = {};
  (answer?.actions ?? []).forEach((a: any) => { actions[a.notificationId] = a; });

  function setAction(notifId: string, update: Partial<{ actionType: string; responseText: string; priorityRank: number }>) {
    const updated = { ...(actions[notifId] ?? { notificationId: notifId }), ...update };
    const newActions = { ...actions, [notifId]: updated };
    onChange({ actions: Object.values(newActions) });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <p className="text-sm text-gray-600">{config.scenarioContext}</p>
      {config.notifications?.map((notif: any) => (
        <div key={notif.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{notif.channel}</span>
            <span className="text-sm font-medium">{notif.senderName}</span>
            <span className="text-xs text-gray-400">({notif.senderRole})</span>
          </div>
          <p className="text-sm text-gray-700">{notif.message}</p>
          <div className="flex gap-2 flex-wrap">
            {config.allowedActions?.map((action: string) => (
              <button key={action} onClick={() => setAction(notif.id, { actionType: action })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${actions[notif.id]?.actionType === action ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                {action.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {['reply', 'ask_clarification'].includes(actions[notif.id]?.actionType) && (
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px]" placeholder="Write your reply..." value={actions[notif.id]?.responseText ?? ''} onChange={e => setAction(notif.id, { responseText: e.target.value })} />
          )}
        </div>
      ))}
    </div>
  );
}

function WelcomeRenderer({ config, answer, onChange }: any) {
  const startTime = useMemo(() => Date.now(), []);

  useEffect(() => {
    const timer = setInterval(() => {
      const spent = Math.round((Date.now() - startTime) / 1000);
      onChange({ acknowledged: true, timeSpentSeconds: spent });
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, onChange]);

  const spent = answer?.timeSpentSeconds ?? 0;

  return (
    <div className="space-y-4">
      {/* Founder message card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {config.founderName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? 'F'}
          </div>
          <div>
            <p className="font-semibold text-sm">{config.founderName}</p>
            {config.founderRole && <p className="text-xs text-gray-500">{config.founderRole}</p>}
          </div>
        </div>
        {config.videoUrl ? (
          <div className="rounded-xl overflow-hidden bg-black aspect-video">
            <video src={config.videoUrl} controls className="w-full h-full" />
          </div>
        ) : null}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{config.founderMessage}</p>
      </div>

      {/* Slack message */}
      {config.slackMessage && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 54 54" className="w-5 h-5"><path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/><path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/><path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/><path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/></svg>
            </div>
            <span className="text-xs font-semibold text-[#1D1C1D]"># general</span>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {config.slackMessage.sender?.[0] ?? 'M'}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-[#1D1C1D]">{config.slackMessage.sender}</span>
                {config.slackMessage.role && <span className="text-xs text-gray-400">{config.slackMessage.role}</span>}
              </div>
              <p className="text-sm text-[#1D1C1D] mt-0.5">{config.slackMessage.message}</p>
            </div>
          </div>
        </div>
      )}

      {spent > 0 && <p className="text-xs text-gray-400 text-right">Reading time: {spent}s</p>}
    </div>
  );
}

type ChatMsg = { role: 'candidate' | 'ai_buyer'; text: string; ts: number };

function SimulatedCallRenderer({ config, answer, onChange, onTrackEvent }: any) {
  const { sessionToken, stepId } = useParams<{ sessionToken: string; stepId: string }>();
  const [callState, setCallState] = useState<'pre' | 'active' | 'ended'>('pre');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  function buildOpenAiHistory(msgs: ChatMsg[]) {
    return msgs.map(m => ({
      role: m.role === 'candidate' ? 'user' as const : 'assistant' as const,
      content: m.text,
    }));
  }

  function updateAnswer(msgs: ChatMsg[], durationSeconds: number) {
    onChange({
      callSessionId: 'chat-' + (answer?.callSessionId?.split('-')[1] ?? Date.now()),
      transcript: msgs.map(m => ({ speaker: m.role, text: m.text, timestampMs: m.ts })),
      outcome: { selectedOutcome: 'no_next_step', aiBuyerInterestFinal: 50, aiBuyerTrustFinal: 40, aiBuyerUrgencyFinal: 30, nextStepAgreed: false },
      metrics: { durationSeconds },
    });
  }

  async function fetchAiReply(history: ChatMsg[]) {
    setAiTyping(true);
    try {
      const res = await api.post<{ message: string }>(
        `/api/candidate/sessions/${sessionToken}/steps/${stepId}/call-chat`,
        { messages: buildOpenAiHistory(history) }
      );
      const aiMsg: ChatMsg = { role: 'ai_buyer', text: res.message, ts: Date.now() };
      const updated = [...history, aiMsg];
      setMessages(updated);
      updateAnswer(updated, elapsed);
      return aiMsg;
    } catch {
      const fallback: ChatMsg = { role: 'ai_buyer', text: 'Scusa, hai detto qualcosa?', ts: Date.now() };
      const updated = [...history, fallback];
      setMessages(updated);
      updateAnswer(updated, elapsed);
    } finally {
      setAiTyping(false);
    }
  }

  async function startCall() {
    setCallState('active');
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    onTrackEvent('call_started');
    const callId = 'chat-' + Date.now();
    onChange({ callSessionId: callId, transcript: [], outcome: { selectedOutcome: 'no_next_step', aiBuyerInterestFinal: 50, aiBuyerTrustFinal: 40, aiBuyerUrgencyFinal: 30, nextStepAgreed: false }, metrics: { durationSeconds: 0 } });
    // Get AI's opening line
    await fetchAiReply([]);
    inputRef.current?.focus();
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || aiTyping) return;
    setInput('');
    const userMsg: ChatMsg = { role: 'candidate', text, ts: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    updateAnswer(updated, elapsed);
    await fetchAiReply(updated);
    inputRef.current?.focus();
  }

  function endCall() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
    onTrackEvent('call_ended');
    updateAnswer(messages, elapsed);
  }

  const persona = config.aiPersona;
  const initials = persona?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? 'AI';
  const maxDuration = config.maxDurationSeconds ?? 720;

  // Pre-call screen
  if (callState === 'pre') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl font-bold mx-auto">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-lg">{persona?.name}</p>
            <p className="text-slate-300 text-sm">{persona?.role}{persona?.company ? ` · ${persona.company}` : ''}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Scenario Brief</p>
            <p className="text-sm text-amber-900 leading-relaxed">{config.publicCandidateBrief}</p>
          </div>
          <p className="text-xs text-gray-400 text-center">Questa è una simulazione testuale. Scrivi come parleresti davvero in una chiamata reale.</p>
          <button onClick={startCall} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 active:scale-[0.98] transition flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            Inizia la chiamata
          </button>
        </div>
      </div>
    );
  }

  // Post-call screen
  if (callState === 'ended') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-center gap-3 text-white">
          <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold">{initials}</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{persona?.name}</p>
            <p className="text-xs text-slate-400">Chiamata terminata · {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
          </div>
        </div>
        <div className="p-4 max-h-64 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'candidate' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-green-50 border-t border-green-200">
          <p className="text-sm font-semibold text-green-700 text-center">Chiamata completata — clicca "Avanti →" per procedere</p>
        </div>
      </div>
    );
  }

  // Active call — chat interface
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: '520px' }}>
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center gap-3 text-white flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">{initials}</div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-slate-800" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">{persona?.name}</p>
          <p className="text-xs text-slate-400 truncate">{persona?.role}{persona?.company ? ` · ${persona.company}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-700 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 && !aiTyping && (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">Connessione in corso...</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === 'candidate' ? 'flex-row-reverse' : 'flex-row'}`}>
            {m.role === 'ai_buyer' && (
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mb-0.5">{initials}</div>
            )}
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'candidate' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {aiTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{initials}</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 space-y-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Scrivi la tua risposta... (Invio per inviare)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={aiTyping}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || aiTyping}
            className="h-[60px] px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition flex items-center justify-center"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <button onClick={endCall} className="w-full py-2 rounded-xl text-sm font-semibold border-2 border-red-300 text-red-600 hover:bg-red-50 transition flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
          Termina chiamata
        </button>
      </div>
    </div>
  );
}

function SpreadsheetEditRenderer({ config, answer, onChange }: any) {
  const { sessionToken, stepId } = useParams<{ sessionToken: string; stepId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sheetUrl: string | null = answer?.sheetUrl ?? null;

  async function openSheet() {
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ sheetId: string; sheetUrl: string }>(
        `/api/candidate/sessions/${sessionToken}/steps/${stepId}/spreadsheet-start`,
        {},
      );
      onChange({ sheetOpened: true, sheetId: data.sheetId, sheetUrl: data.sheetUrl });
      window.open(data.sheetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Impossibile creare il foglio. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Scenario context */}
      {config.scenarioContext && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scenario</p>
          <p className="text-sm text-gray-700 leading-relaxed">{config.scenarioContext}</p>
        </div>
      )}

      {/* Task prompt */}
      {config.taskPrompt && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800">{config.taskPrompt}</p>
        </div>
      )}

      {/* Cells reference table */}
      {config.cells?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Celle da compilare</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-16">Cella</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Descrizione</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-24">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {config.cells.map((cell: any, i: number) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-mono text-sm text-blue-700 font-semibold">{cell.ref}</td>
                  <td className="px-4 py-2.5 text-gray-700">{cell.label}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cell.cellType === 'numeric' ? 'bg-blue-50 text-blue-700' :
                      cell.cellType === 'formula' ? 'bg-purple-50 text-purple-700' :
                      'bg-green-50 text-green-700'
                    }`}>{cell.cellType}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sheet action */}
      {!sheetUrl ? (
        <div className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
          <button
            onClick={openSheet}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Preparazione foglio...</>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
                Apri il foglio Google Sheets
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center">Si aprirà una nuova scheda con il tuo foglio personale. Torna qui quando hai finito.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800">Foglio aperto</p>
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline truncate block">
                Riaprire il foglio →
              </a>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">Quando hai compilato tutte le celle, clicca <strong>Avanti</strong> qui sotto per inviare le tue risposte.</p>
        </div>
      )}
    </div>
  );
}
