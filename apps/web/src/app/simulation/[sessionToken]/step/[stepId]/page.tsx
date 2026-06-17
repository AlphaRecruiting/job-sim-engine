'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type StepData = { step: { id: string; type: string; title: string; instructions: string; timeLimitSeconds?: number; publicConfig: any }; submission?: { status: string } | null; autosavedAnswer?: any };

export default function StepPage() {
  const { sessionToken, stepId } = useParams<{ sessionToken: string; stepId: string }>();
  const router = useRouter();
  const [data, setData] = useState<StepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get<StepData>(`/api/candidate/sessions/${sessionToken}/steps/${stepId}`)
      .then(d => { setData(d); if (d.autosavedAnswer) setAnswer(d.autosavedAnswer); if (d.step.timeLimitSeconds) setTimeLeft(d.step.timeLimitSeconds); })
      .catch(e => setError(e.message)).finally(() => setLoading(false));

    api.post(`/api/candidate/sessions/${sessionToken}/steps/${stepId}/events`, { eventType: 'step_started' }).catch(() => {});
  }, [sessionToken, stepId]);

  // Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(t => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // Autosave
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!data) return null;

  const { step } = data;
  const alreadySubmitted = data.submission?.status === 'submitted';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-semibold">{step.title}</h1>
          <p className="text-xs text-gray-400 capitalize">{step.type.replace(/_/g, ' ')}</p>
        </div>
        {timeLeft !== null && (
          <div className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">{step.instructions}</p>
        </div>

        {alreadySubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="font-semibold text-green-700">Step submitted</p>
          </div>
        ) : (
          <>
            <StepRenderer type={step.type} config={step.publicConfig} answer={answer} onAnswerChange={setAnswer} onTrackEvent={trackEvent} />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end">
              <button onClick={handleSubmit} disabled={submitting || (!answer && step.type !== 'welcome')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {submitting ? 'Submitting...' : step.type === 'welcome' ? 'Continue →' : 'Submit Step →'}
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

function SimulatedCallRenderer({ config, answer, onChange, onTrackEvent }: any) {
  const [callState, setCallState] = useState<'pre' | 'active' | 'ended'>('pre');
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicOk(true);
    } catch { setMicOk(false); }
  }

  async function startCall() {
    setCallState('active');
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    onTrackEvent('call_started');
    // In production: connect to realtime API using the token from /realtime-call/start
    onChange({ callSessionId: 'demo-' + Date.now(), transcript: [], outcome: { selectedOutcome: 'no_next_step', aiBuyerInterestFinal: 50, aiBuyerTrustFinal: 40, aiBuyerUrgencyFinal: 30, nextStepAgreed: false }, metrics: { durationSeconds: 0 } });
  }

  function endCall() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
    onTrackEvent('call_ended');
    onChange((prev: any) => ({ ...prev, metrics: { durationSeconds: elapsed } }));
  }

  const maxDuration = config.maxDurationSeconds ?? 720;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-2">Scenario Brief</h3>
        <p className="text-sm text-gray-700">{config.publicCandidateBrief}</p>
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium">You are speaking with: </span>{config.aiPersona?.name}, {config.aiPersona?.role}{config.aiPersona?.company ? ` at ${config.aiPersona.company}` : ''}
      </div>
      <div className="text-sm text-gray-500">Estimated duration: {Math.round((config.estimatedDurationSeconds ?? 600) / 60)} minutes</div>

      {callState === 'pre' && (
        <div className="space-y-3">
          <button onClick={checkMic} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
            {micOk === null ? '🎤 Test Microphone' : micOk ? '✅ Microphone Ready' : '❌ Microphone Access Denied'}
          </button>
          {micOk === false && <p className="text-red-600 text-sm">Please allow microphone access in your browser settings.</p>}
          <button onClick={startCall} className="block w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition">
            Start Call
          </button>
        </div>
      )}

      {callState === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 font-medium text-sm">Call in progress</span>
            </div>
            <div className="font-mono text-sm font-bold">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} / {Math.floor(maxDuration / 60)}:00
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">The AI buyer is live. Conduct your discovery call.</p>
          <button onClick={endCall} className="w-full border-2 border-red-400 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition">
            End Call
          </button>
        </div>
      )}

      {callState === 'ended' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="font-semibold text-blue-700">Call ended</p>
          <p className="text-sm text-blue-600 mt-1">Duration: {Math.floor(elapsed / 60)}m {elapsed % 60}s. Click Submit to finalize.</p>
        </div>
      )}
    </div>
  );
}
