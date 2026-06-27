/* ══════════════════════════════════════════
   Alpha × Pillar — SDR Simulation FASE 1
   with OpenAI TTS Voice
   ══════════════════════════════════════════ */


// ── Analytics state ──
const analytics = {
  startTime: Date.now(),
  founderWatchTime: 0,
  slackReadStart: 0,
  slackReadTime: 0,
  interactions: 0,
  slideTimestamps: [],
};

// ── Preview mode (company dry-run via ?preview=true) ──
const isPreviewMode = new URLSearchParams(window.location.search).get('preview') === 'true';

// ── Dev mode: skip phases with keyboard ──
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  const phaseMap = {
    '0': 'phase-boot',
    '1': 'phase-founder',
    '2': 'phase-slack',
    '3': 'phase-crm',
    '4': 'phase-handover',
  };
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (phaseMap[e.key]) {
      console.log(`⏩ DEV: Skipping to ${phaseMap[e.key]}`);
      document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
      document.getElementById(phaseMap[e.key]).classList.add('active');
      // Close any open overlays
      document.getElementById('candidate-overlay')?.classList.remove('active');
    }
  });
  console.log('🛠️ DEV MODE: Press 0=Boot, 1=Founder, 2=Slack to skip phases');
}

// ── TTS audio cache ──
const audioCache = [];

// ── Signed session token for the protected API routes (/api/tts, /api/chat) ──
let __simToken = null;
async function fetchSimToken() {
  try {
    const r = await fetch('/api/sim/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (r.ok) {
      const d = await r.json();
      __simToken = d.token;
    }
  } catch (e) {
    console.error('Failed to obtain sim session token:', e);
  }
}
// Wraps fetch, attaching the session token and refreshing it once on 401.
async function simFetch(path, opts = {}) {
  if (!__simToken) await fetchSimToken();
  const withToken = () => ({
    ...opts,
    headers: { ...(opts.headers || {}), 'x-sim-token': __simToken || '' },
  });
  let res = await fetch(path, withToken());
  if (res.status === 401) {
    await fetchSimToken();
    res = await fetch(path, withToken());
  }
  return res;
}
window.simFetch = simFetch;
// Kick off token acquisition immediately so it's ready before the first call.
fetchSimToken();

// ── Phase management ──
function showPhase(id) {
  document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Founder slides ──
const founderSlides = [
  {
    text: 'Ciao, sono Gabriel. Benvenuto in Pillar.',
    html: 'Ciao, sono <strong>Gabriel</strong>. Benvenuto in <strong>Pillar</strong>.',
  },
  {
    text: "Stiamo costruendo il sistema operativo per l'edilizia. Un settore da 13 trilioni che ancora lavora con fogli Ecsel e WhatsApp.",
    html: "Stiamo costruendo il <strong>sistema operativo per l'edilizia</strong>. Un settore da 13 trilioni che ancora lavora con fogli Excel e WhatsApp.",
  },
  {
    text: 'In meno di un anno abbiamo raggiunto oltre 500 imprese e chiuso un round da 12 milioni di euro.',
    html: 'In meno di un anno abbiamo raggiunto <strong>oltre 500 imprese</strong> e chiuso un round da <strong>€12 milioni</strong>.',
  },
  {
    text: "Come SDR Inbound sarai il primo contatto con chi mostra interesse per Pillar. Il tuo compito sarà capire se c’è un reale bisogno, qualificare l’opportunità e organizzare una demo con uno dei nostri Account Executive.",
    html: "Come <strong>SDR Inbound</strong> sarai il primo contatto con chi mostra interesse per Pillar. Il tuo compito sarà capire se c’è un <strong>reale bisogno</strong>, qualificare l’opportunità e organizzare una demo con uno dei nostri <strong>Account Executive</strong>.",
  },
  {
    text: "Oggi vivrai una simulazione ispirata a una vera giornata di lavoro. Dovrai prendere decisioni, parlare con un potenziale cliente e qualificare le opportunità migliori.",
    html: "Oggi vivrai una simulazione ispirata a una <strong>vera giornata di lavoro</strong>. Dovrai prendere decisioni, parlare con un potenziale cliente e qualificare <strong>le opportunità migliori</strong>.",
  },
  {
    text: "Non cerchiamo la risposta perfetta. Vogliamo capire come ragioni, come impari e come affronti le sfide.",
    html: "Non cerchiamo la risposta perfetta. Vogliamo capire come <strong>ragioni</strong>, come <strong>impari</strong> e come affronti le <strong>sfide</strong>.",
  },
  {
    text: "Qui non si gestiscono lead. Si costruisce crescita. Iniziamo.",
    html: "Qui non si gestiscono lead. <strong>Si costruisce crescita. Iniziamo.</strong>",
  },
];

// ══════════════════════════════════════════
// TTS — Fetch audio from server proxy
// ══════════════════════════════════════════
async function fetchTTS(text) {
  try {
    const res = await simFetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'ash' }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    // Wait for audio metadata to load so we know duration
    await new Promise((resolve, reject) => {
      audio.addEventListener('loadedmetadata', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
    });
    return audio;
  } catch (e) {
    console.warn('TTS fallback for:', text.substring(0, 40), e);
    return null;
  }
}

// ══════════════════════════════════════════
// ══════════════════════════════════════════
// PREVIEW MODE — company dry-run
// ══════════════════════════════════════════

function initPreviewMode() {
  analytics.isPreview = true;

  // Show persistent badge across all phases
  document.getElementById('preview-badge')?.classList.add('active');

  // Inject banner into boot screen
  const bootContainer = document.querySelector('#phase-boot .boot-container');
  if (bootContainer) {
    const banner = document.createElement('div');
    banner.className = 'boot-preview-banner';
    banner.innerHTML = `<span class="boot-preview-banner-dot"></span>Modalità anteprima aziendale — stai visualizzando la simulazione candidati`;
    bootContainer.insertBefore(banner, bootContainer.firstChild);
  }

  // Change CTA label
  const startBtn = document.getElementById('btn-start-sim');
  if (startBtn) {
    startBtn.querySelector('.btn-start-inner').innerHTML = `
      Avvia anteprima
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    `;
  }

  // Preload TTS slides 1+ in background (same as normal flow)
  founderSlides.slice(1).forEach((slide, i) => {
    fetchTTS(slide.text).then(audio => { audioCache[i + 1] = audio; });
  });

  // CTA click — skip form, start directly
  startBtn?.addEventListener('click', async () => {
    analytics.candidate = { firstName: 'Valutatore', lastName: '', email: 'preview@pillar.it' };
    candidateName = 'Valutatore';

    founderSlides[0].text = `Ciao! Questa è l'anteprima della simulazione SDR Inbound di Pillar.`;
    founderSlides[0].html = `Ciao! Questa è l'<strong>anteprima</strong> della simulazione <strong>SDR Inbound</strong> di Pillar.`;
    audioCache[0] = await fetchTTS(founderSlides[0].text);

    showPhase('phase-founder');
    setTimeout(startFounderPresentation, 400);
  }, { once: true });
}

// ══════════════════════════════════════════
// PHASE 0 — BOOT (preload TTS silently in background)
// ══════════════════════════════════════════

async function runBoot() {
  // Check if we want to skip founder presentation entirely (bypasses TTS preload API costs)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('skipfounder') === 'true') {
    console.log('⏩ Dev Mode: Bypassing Founder Presentation & TTS Preloading');
    analytics.candidate = { firstName: 'Luca', lastName: 'Dev', email: 'dev@pillar.it' };
    candidateName = 'Luca';
    
    // Skip to Slack phase directly
    showPhase('phase-slack');
    setTimeout(() => {
      startSlackPhase();
    }, 100);
    return;
  }

  // Preview mode for companies — skip the form
  if (isPreviewMode) {
    initPreviewMode();
    return;
  }

  // Preload TTS for slides 1+ silently in background (slide 0 will be personalized)
  const ttsPromises = founderSlides.slice(1).map((slide, i) =>
    fetchTTS(slide.text).then(audio => {
      audioCache[i + 1] = audio;
    })
  );

  // Don't await — let it load in background
  Promise.all(ttsPromises).then(() => {
    const ttsLoaded = audioCache.filter(Boolean).length;
    console.log(`✅ TTS loaded: ${ttsLoaded}/${founderSlides.length} slides`);
  });

  // CTA opens candidate form
  const startBtn = document.getElementById('btn-start-sim');
  const overlay = document.getElementById('candidate-overlay');
  const form = document.getElementById('candidate-form');

  startBtn.addEventListener('click', () => {
    overlay.classList.add('active');
    document.getElementById('cand-name').focus();
  }, { once: true });

  let formSubmitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (formSubmitted) return;
    formSubmitted = true;

    const submitBtn = form.querySelector('.btn-candidate-submit');
    submitBtn.querySelector('.btn-start-inner').textContent = 'Preparazione in corso…';
    submitBtn.disabled = true;

    const firstName = document.getElementById('cand-name').value.trim();
    const lastName = document.getElementById('cand-surname').value.trim();
    const email = document.getElementById('cand-email').value.trim();

    // Store candidate data
    analytics.candidate = { firstName, lastName, email };

    // Personalize first slide
    founderSlides[0].text = `Ciao ${firstName}, sono Gabriel. Benvenuto in Pillar.`;
    founderSlides[0].html = `Ciao <strong>${firstName}</strong>, sono <strong>Gabriel</strong>. Benvenuto in <strong>Pillar</strong>.`;

    // Generate personalized TTS for slide 0
    const personalAudio = await fetchTTS(founderSlides[0].text);
    audioCache[0] = personalAudio;

    // Start simulation
    overlay.classList.remove('active');
    showPhase('phase-founder');
    setTimeout(startFounderPresentation, 400);
  });
}

// ══════════════════════════════════════════
// PHASE 1 — FOUNDER PRESENTATION with TTS
// ══════════════════════════════════════════
const captionEl = document.getElementById('founder-caption');
const timerText = document.getElementById('timer-text');
const timerCircle = document.getElementById('timer-circle');
const dotsContainer = document.getElementById('slide-dots');
const audioWave = document.getElementById('audio-wave');
const circumference = 2 * Math.PI * 16;

// Create dots
founderSlides.forEach((_, i) => {
  const d = document.createElement('span');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  dotsContainer.appendChild(d);
});
const dots = dotsContainer.querySelectorAll('.dot');

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ':' + String(sec).padStart(2, '0');
}

// Compute remaining duration from slide index onward
function getRemainingDuration(fromIndex) {
  let total = 0;
  for (let i = fromIndex; i < founderSlides.length; i++) {
    const audio = audioCache[i];
    if (audio && isFinite(audio.duration)) {
      total += audio.duration * 1000 + 500;
    } else {
      total += 4000;
    }
  }
  return total;
}

// Track current slide for timer
let currentSlideIndex = 0;
let slideStartTime = 0;

async function playSlide(index) {
  const slide = founderSlides[index];
  const audio = audioCache[index];
  currentSlideIndex = index;
  slideStartTime = Date.now();

  // Update dots
  dots.forEach((d, j) => d.classList.toggle('active', j === index));

  // Fade out previous caption
  captionEl.classList.remove('caption-visible');
  await new Promise(r => setTimeout(r, 200));

  // Show new caption with fade-in
  captionEl.innerHTML = slide.html;
  void captionEl.offsetWidth;
  captionEl.classList.add('caption-visible');

  if (audio) {
    audioWave.classList.remove('paused');
    const audioPromise = new Promise(resolve => {
      audio.addEventListener('ended', resolve, { once: true });
      audio.play().catch(() => resolve());
    });
    await audioPromise;
    audioWave.classList.add('paused');
    await new Promise(r => setTimeout(r, 500));
  } else {
    await new Promise(r => setTimeout(r, 4000));
  }
}

async function startFounderPresentation() {
  analytics.founderWatchStart = Date.now();
  const totalDuration = getRemainingDuration(0);
  const globalStart = Date.now();

  // Timer updates based on actual elapsed vs total
  const timerInterval = setInterval(() => {
    // Calculate remaining: time left in current slide + all future slides
    const audio = audioCache[currentSlideIndex];
    const currentSlideDuration = (audio && isFinite(audio.duration))
      ? audio.duration * 1000 + 500
      : 4000;
    const elapsedInSlide = Date.now() - slideStartTime;
    const remainingInSlide = Math.max(0, currentSlideDuration - elapsedInSlide);
    const remainingFuture = getRemainingDuration(currentSlideIndex + 1);
    const remaining = remainingInSlide + remainingFuture;

    timerText.textContent = formatTime(remaining);
    const elapsed = Date.now() - globalStart;
    const pct = Math.min(elapsed / (elapsed + remaining), 1);
    timerCircle.setAttribute(
      'stroke-dashoffset',
      String(circumference * (1 - pct))
    );
  }, 200);

  // Play each slide sequentially
  for (let i = 0; i < founderSlides.length; i++) {
    analytics.slideTimestamps.push(Date.now());
    await playSlide(i);
  }

  clearInterval(timerInterval);
  timerText.textContent = '0:00';
  timerCircle.setAttribute('stroke-dashoffset', '0');

  // End — stop audio wave
  audioWave.classList.add('paused');
  analytics.founderWatchTime = Date.now() - analytics.founderWatchStart;

  // Transition to Slack
  await new Promise(r => setTimeout(r, 1200));
  showPhase('phase-slack');
  setTimeout(startSlackPhase, 500);
}

// ══════════════════════════════════════════
// PHASE 2 — WORKSPACE (Slack-inspired)
// ══════════════════════════════════════════

// ── Team members ──
const team = {
  marco:   { name: 'Marco Conti',   initials: 'MC', color: 'linear-gradient(135deg,#6366f1,#7c3aed)', role: 'Sales Manager' },
  luca:    { name: 'Luca Bianchi',  initials: 'LB', color: 'linear-gradient(135deg,#3b82f6,#2563eb)', role: 'SDR Senior' },
  sara:    { name: 'Sara Ricci',    initials: 'SR', color: 'linear-gradient(135deg,#ec4899,#db2777)', role: 'Account Executive' },
  giulia:  { name: 'Giulia Ferro',  initials: 'GF', color: 'linear-gradient(135deg,#22c55e,#16a34a)', role: 'SDR' },
  andrea:  { name: 'Andrea Russo',  initials: 'AR', color: 'linear-gradient(135deg,#f97316,#ea580c)', role: 'Marketing' },
};

// ── Channel data ──
const channelTopics = {
  welcome: 'Benvenuto nel team Pillar',
  general: 'Conversazioni generali del team',
  sales:   'Pipeline, deal e aggiornamenti commerciali',
  inbound: 'Lead inbound e opportunità',
};

// Store messages per channel
const channelMessages = {
  welcome: [],
  general: [],
  sales: [],
  inbound: [],
};

const channelHistory = {
  welcome: [],
  general: [],
  sales: [],
  inbound: [],
};

const lastSenderInChannel = {
  welcome: '',
  general: '',
  sales: '',
  inbound: '',
};

let activeChannel = 'welcome';
let candidateName = '';
let welcomeSequenceDone = false;
let crmOpened = false;

// ── DOM refs ──
const wsMessages = document.getElementById('ws-messages');
const wsScroll = document.getElementById('ws-messages-scroll');
const wsChannelName = document.getElementById('ws-chat-channel-name');
const wsTopic = document.getElementById('ws-chat-topic');
const wsTypingBar = document.getElementById('ws-typing-bar');
const wsTypingText = document.getElementById('ws-typing-text');
const wsInput = document.getElementById('ws-input');
const wsSendBtn = document.getElementById('ws-send');

// ── Helpers ──
function wsDelay(ms) { return new Promise(r => setTimeout(r, ms)); }
function wsNow() {
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

// ══════════════════════════════════════════
// SOUND ENGINE (Web Audio API — no files)
// ══════════════════════════════════════════
let sndCtx = null;
function getSndCtx() {
  if (!sndCtx) {
    sndCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sndCtx && sndCtx.state === 'suspended') {
    sndCtx.resume().catch(() => {});
  }
  return sndCtx;
}

// Resume AudioContext on first user interaction (critical for bypass / ?skipfounder mode)
// Using capturing phase (capture: true) and mousedown ensures this runs BEFORE element-specific click listeners.
['mousedown', 'keydown', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, () => {
    const ctx = getSndCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }, { capture: true, once: true });
});

function playNotifSound() {
  try {
    const ctx = getSndCtx();
    // Slack-like "knock" — two short tones
    [0, 0.08].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = i === 0 ? 880 : 1100;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  } catch(e) {}
}

function playSendSound() {
  try {
    const ctx = getSndCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

function playClickSound() {
  try {
    const ctx = getSndCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 500;
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch(e) {}
}

function createMsgHTML(member, time, html, opts = {}, channel = null) {
  let isGrouped = false;
  if (channel && lastSenderInChannel[channel] === member.name && !opts.forceNewBlock) {
    isGrouped = true;
  }
  if (channel) {
    lastSenderInChannel[channel] = member.name;
  }

  const msg = document.createElement('div');
  msg.setAttribute('data-sender', member.name);

  if (isGrouped) {
    msg.className = 'ws-msg ws-msg-grouped';
    msg.innerHTML = `
      <div class="ws-msg-time-hover">${time}</div>
      <div class="ws-msg-body">
        <div class="ws-msg-text">${html}</div>
        ${opts.reactions ? `<div class="ws-reactions">${opts.reactions.map(r =>
          `<div class="ws-reaction">${r.emoji}<span class="ws-reaction-count">${r.count}</span></div>`
        ).join('')}</div>` : ''}
      </div>
    `;
  } else {
    msg.className = 'ws-msg';
    msg.innerHTML = `
      <div class="ws-msg-avatar" style="background:${member.color}">${member.initials}</div>
      <div class="ws-msg-body">
        <div class="ws-msg-header">
          <span class="ws-msg-name">${member.name}</span>
          <span class="ws-msg-time">${time}</span>
        </div>
        <div class="ws-msg-text">${html}</div>
        ${opts.reactions ? `<div class="ws-reactions">${opts.reactions.map(r =>
          `<div class="ws-reaction">${r.emoji}<span class="ws-reaction-count">${r.count}</span></div>`
        ).join('')}</div>` : ''}
      </div>
    `;
  }
  return msg;
}

function addMsgToChannel(channel, msgEl, opts = {}) {
  channelMessages[channel].push(msgEl);
  
  if (opts.sender && opts.content) {
    channelHistory[channel].push({
      sender: opts.sender,
      senderName: opts.senderName || '',
      content: opts.content
    });
  }

  if (activeChannel === channel) {
    wsMessages.appendChild(msgEl);
    wsScroll.scrollTop = wsScroll.scrollHeight;
  } else {
    updateBadge(channel);
  }
  // Play sound for incoming messages (not for own messages)
  if (!opts.silent && !opts.own) playNotifSound();
}

function updateBadge(channel) {
  const badge = document.getElementById(`badge-${channel}`);
  if (!badge) return;
  const current = parseInt(badge.textContent) || 0;
  badge.textContent = current + 1;
  badge.style.display = 'inline-block';
  // Re-trigger pop animation
  badge.style.animation = 'none';
  void badge.offsetWidth;
  badge.style.animation = '';
}

function clearBadge(channel) {
  const badge = document.getElementById(`badge-${channel}`);
  if (badge) { badge.style.display = 'none'; badge.textContent = '0'; }
}

async function showTyping(name, durationMs = 1200) {
  wsTypingText.textContent = `${name} sta scrivendo…`;
  wsTypingBar.style.display = 'flex';
  await wsDelay(durationMs);
  wsTypingBar.style.display = 'none';
}

// ── Channel switching ──
function switchChannel(channel) {
  if (channel === activeChannel) return;
  activeChannel = channel;
  playClickSound();

  // Update sidebar active state
  document.querySelectorAll('.ws-channel[data-channel]').forEach(el => {
    el.classList.toggle('ws-channel-active', el.dataset.channel === channel);
  });

  // Update header
  wsChannelName.textContent = channel;
  wsTopic.textContent = channelTopics[channel] || '';
  wsInput.placeholder = `Scrivi un messaggio in #${channel}…`;

  // Clear badge
  clearBadge(channel);

  // Render messages
  renderChannel(channel);
}

function renderChannel(channel) {
  // Clear current messages (keep day divider)
  wsMessages.innerHTML = `<div class="ws-day-divider"><span>Oggi</span></div>`;

  // Re-append stored messages
  channelMessages[channel].forEach(msg => {
    // Clone to re-trigger animation
    const clone = msg.cloneNode(true);
    clone.style.animation = 'none';
    clone.style.opacity = '1';
    clone.style.transform = 'none';
    wsMessages.appendChild(clone);
  });

  wsScroll.scrollTop = wsScroll.scrollHeight;
}

// Bind sidebar clicks
document.getElementById('ws-channel-list').addEventListener('click', (e) => {
  const li = e.target.closest('.ws-channel[data-channel]');
  if (li) switchChannel(li.dataset.channel);
});

// ── Pre-populate channels ──
function prePopulateChannels() {
  // #general — team already active
  const g1 = createMsgHTML(team.luca, '08:45', 'Buongiorno a tutti! ☕', {}, 'general');
  const g2 = createMsgHTML(team.giulia, '08:47', 'Buongiorno! Oggi ho 3 follow-up da fare 💪', {}, 'general');
  const g3 = createMsgHTML(team.sara, '08:52', 'Demo chiusa con EdilNova 🎉 Contratto firmato!', {
    reactions: [
      { emoji: '🎉', count: 6 },
      { emoji: '🚀', count: 4 },
      { emoji: '💪', count: 3 },
    ]
  }, 'general');
  channelMessages.general.push(g1, g2, g3);
  channelHistory.general.push(
    { sender: 'luca', senderName: team.luca.name, content: 'Buongiorno a tutti! ☕' },
    { sender: 'giulia', senderName: team.giulia.name, content: 'Buongiorno! Oggi ho 3 follow-up da fare 💪' },
    { sender: 'sara', senderName: team.sara.name, content: 'Demo chiusa con EdilNova 🎉 Contratto firmato!' }
  );

  // #sales — pipeline context
  const s1 = createMsgHTML(team.marco, '08:30', 'Aggiornamento pipeline: questa settimana abbiamo <em>12 deal attivi</em> e 3 in fase di closing.', {}, 'sales');
  const s2 = createMsgHTML(team.sara, '08:35', 'Ho un follow-up con Costruzioni Romani alle 14:00. Se qualcuno ha info sul loro volume cantieri, mi faccia sapere.', {}, 'sales');
  const s3 = createMsgHTML(team.marco, '08:40', 'Reminder: obiettivo settimanale è <em>8 demo prenotate</em>. Siamo a 5. Spingiamo 🔥', {}, 'sales');
  channelMessages.sales.push(s1, s2, s3);
  channelHistory.sales.push(
    { sender: 'marco', senderName: team.marco.name, content: 'Aggiornamento pipeline: questa settimana abbiamo 12 deal attivi e 3 in fase di closing.' },
    { sender: 'sara', senderName: team.sara.name, content: 'Ho un follow-up con Costruzioni Romani alle 14:00. Se qualcuno ha info sul loro volume cantieri, mi faccia sapere.' },
    { sender: 'marco', senderName: team.marco.name, content: 'Reminder: obiettivo settimanale è 8 demo prenotate. Siamo a 5. Spingiamo 🔥' }
  );

  // #inbound — lead context
  const i1 = createMsgHTML(team.andrea, '08:50', '📊 Report settimanale: <em>14 nuovi lead</em> da campagne LinkedIn e Google Ads. Qualità media alta.', {}, 'inbound');
  const i2 = createMsgHTML(team.marco, '08:55', 'Grazie Andrea. Team SDR: controllate la pipeline, ci sono opportunità calde da qualificare oggi.', {}, 'inbound');
  channelMessages.inbound.push(i1, i2);
  channelHistory.inbound.push(
    { sender: 'andrea', senderName: team.andrea.name, content: '📊 Report settimanale: 14 nuovi lead da campagne LinkedIn e Google Ads. Qualità media alta.' },
    { sender: 'marco', senderName: team.marco.name, content: 'Grazie Andrea. Team SDR: controllate la pipeline, ci sono opportunità calde da qualificare oggi.' }
  );
}

// ── Welcome sequence (main onboarding) ──
async function runWelcomeSequence() {
  const firstName = candidateName;

  // Message 1 — 09:02
  await showTyping('Marco', 1000);
  const m1 = createMsgHTML(team.marco, '09:02', `Ciao ${firstName}, benvenuto nel team! 👋`, {}, 'welcome');
  addMsgToChannel('welcome', m1, { sender: 'marco', senderName: team.marco.name, content: `Ciao ${firstName}, benvenuto nel team! 👋` });
  await wsDelay(1200);

  // Message 2 — 09:03
  await showTyping('Marco', 1800);
  const m2 = createMsgHTML(team.marco, '09:03', `Tra poco entrerai nel CRM. Troverai la <em>pipeline inbound</em> con alcuni lead arrivati negli ultimi giorni. Guardali, decidi su quali investiresti il tuo tempo e spiegami il perché.`, {}, 'welcome');
  addMsgToChannel('welcome', m2, { sender: 'marco', senderName: team.marco.name, content: `Tra poco entrerai nel CRM. Troverai la pipeline inbound con alcuni lead arrivati negli ultimi giorni. Guardali, decidi su quali investiresti il tuo tempo e spiegami il perché.` });
  await wsDelay(1500);

  // Message 3 — 09:04
  await showTyping('Marco', 2000);
  const m3 = createMsgHTML(team.marco, '09:04', `Le informazioni non saranno perfette né complete. Nella realtà è quasi sempre così. Sta a te capire dove vale la pena approfondire.`, {}, 'welcome');
  addMsgToChannel('welcome', m3, { sender: 'marco', senderName: team.marco.name, content: `Le informazioni non saranno perfette né complete. Nella realtà è quasi sempre così. Sta a te capire dove vale la pena approfondire.` });
  await wsDelay(1500);

  // Message 4 — 09:05 (two paragraphs)
  await showTyping('Marco', 2400);
  const m4 = createMsgHTML(team.marco, '09:05', `Non esiste una risposta giusta. Voglio vedere come prendi decisioni, come stabilisci le priorità e cosa consideri davvero importante.<br><br>Se prima di decidere vuoi raccogliere più contesto, il workspace è lì apposta. Sentiti libero di esplorarlo.`, {}, 'welcome');
  addMsgToChannel('welcome', m4, { sender: 'marco', senderName: team.marco.name, content: `Non esiste una risposta giusta. Voglio vedere come prendi decisioni, come stabilisci le priorità e cosa consideri davvero importante. Se prima di decidere vuoi raccogliere più contesto, il workspace è lì apposta. Sentiti libero di esplorarlo.` });
  await wsDelay(800);

  // Persistent CTA Banner
  const ctaWrapper = document.createElement('div');
  ctaWrapper.className = 'ws-cta-wrapper';
  ctaWrapper.id = 'ws-cta-wrapper';
  ctaWrapper.innerHTML = `
    <div class="ws-cta-banner">
      <div class="ws-cta-banner-text">
        <span class="ws-cta-banner-icon">📋</span>
        <div>
          <strong>Prossimo step</strong>
          <span>Apri il CRM e analizza la pipeline inbound.</span>
        </div>
      </div>
      <button class="ws-cta-btn" id="ws-cta-open-crm">
        Apri CRM
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </div>
  `;
  addMsgToChannel('welcome', ctaWrapper);

  // Bind CTA via event delegation (cloneNode in renderChannel loses direct listeners)
  wsMessages.addEventListener('click', (e) => {
    const btn = e.target.closest('#ws-cta-open-crm, .ws-cta-btn');
    if (!btn || crmOpened) return;
    crmOpened = true;
    analytics.interactions++;
    analytics.slackReadTime = Date.now() - analytics.slackReadStart;
    analytics.totalTime = Date.now() - analytics.startTime;
    // Transition to CRM phase
    showPhase('phase-crm');
    setTimeout(() => {
      if (typeof initCRM === 'function') initCRM();
    }, 400);
  });

  // Enable input after welcome sequence
  welcomeSequenceDone = true;
  wsInput.disabled = false;
  wsSendBtn.disabled = false;
  wsInput.focus();

  // ── Auto-nudge if candidate doesn't click CRM ──
  startNudgeTimers();
}

// ── Nudge timers ──
let nudgeCount = 0;
function startNudgeTimers() {
  // First nudge after 45 seconds (timestamp 10:41)
  setTimeout(async () => {
    if (crmOpened || nudgeCount > 0) return; // already nudged or CRM opened
    nudgeCount++;
    if (activeChannel === 'welcome') {
      await showTyping('Marco', 1200);
    }
    const nudge1 = createMsgHTML(team.marco, '10:41', `Sei pronto? Apri il CRM quando vuoi e inizia a dare un’occhiata ai lead.`, { forceNewBlock: true }, 'welcome');
    addMsgToChannel('welcome', nudge1, { sender: 'marco', senderName: team.marco.name, content: `Sei pronto? Apri il CRM quando vuoi e inizia a dare un’occhiata ai lead.` });
  }, 45000);

  // Second nudge / Auto-redirect after 150 seconds (2.5 minutes) (timestamp 10:43)
  setTimeout(async () => {
    if (crmOpened) return;
    
    const currentPhase = document.querySelector('.phase.active')?.id;
    if (currentPhase !== 'phase-slack') return;

    nudgeCount = 999; // prevent other actions
    
    // Force switch to welcome channel to ensure it renders visually
    activeChannel = ''; 
    switchChannel('welcome');
    await wsDelay(1000); // short delay to register switch
    
    await showTyping('Marco', 1500);
    const forceMsg = createMsgHTML(team.marco, '10:43', 
      `Perfetto, direi che è il momento di iniziare.<br><br>Ti ho aperto la pipeline inbound. Ora sta a te capire dove vale davvero la pena investire il tuo tempo.`, 
      { forceNewBlock: true }, 'welcome');
    addMsgToChannel('welcome', forceMsg, { sender: 'marco', senderName: team.marco.name, content: `Perfetto, direi che è il momento di iniziare. Ti ho aperto la pipeline inbound. Ora sta a te capire dove vale davvero la pena investire il tuo tempo.` });
    
    // Auto-trigger CRM open after 6 seconds so they can read the message first
    setTimeout(() => {
      if (!crmOpened) {
        const currentPhase2 = document.querySelector('.phase.active')?.id;
        if (currentPhase2 === 'phase-slack') {
          const btn = document.getElementById('ws-cta-open-crm');
          if (btn) btn.click();
        }
      }
    }, 6000);
  }, 150000);
}

// ── Candidate message sending ──
const candidateMember = {
  get name() { return candidateName || 'Tu'; },
  get initials() { return (candidateName || 'T').charAt(0).toUpperCase(); },
  color: 'linear-gradient(135deg,#f97316,#ef4444)',
};

function sendCandidateMessage() {
  const text = wsInput.value.trim();
  if (!text) return;

  wsInput.value = '';
  playSendSound();
  analytics.interactions++;

  const msg = createMsgHTML(candidateMember, wsNow(), text, {}, activeChannel);
  addMsgToChannel(activeChannel, msg, { own: true, sender: 'user', senderName: candidateMember.name, content: text });

  // Track what candidate writes
  if (!analytics.candidateMessages) analytics.candidateMessages = [];
  analytics.candidateMessages.push({ channel: activeChannel, text, time: Date.now() });

  // Auto-replies
  triggerAutoReply(activeChannel, text);
}

// Bind input
wsInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendCandidateMessage();
  }
});
wsSendBtn.addEventListener('click', sendCandidateMessage);

// ── Auto-replies via OpenAI API ──
const replyCountPerChannel = {
  welcome: 0,
  general: 0,
  sales: 0,
  inbound: 0,
};
const MAX_REPLIES_SECONDARY = 2; // limit for general, sales, inbound

function getColleagueForChannel(channel, text = '') {
  const txt = text.toLowerCase();
  if (channel === 'welcome') return 'marco';
  if (channel === 'sales') return 'sara';
  if (channel === 'inbound') return 'andrea';
  
  if (channel === 'general') {
    if (txt.includes('giulia')) return 'giulia';
    if (txt.includes('marco')) return 'marco';
    if (txt.includes('sara')) return 'sara';
    if (txt.includes('andrea')) return 'andrea';
    return 'luca'; // default general colleague
  }
  return 'marco';
}

async function triggerAutoReply(channel, userText) {
  const colleagueKey = getColleagueForChannel(channel, userText);
  const colleague = team[colleagueKey];
  if (!colleague) return;

  // Check reply limits for secondary channels
  if (channel !== 'welcome' && replyCountPerChannel[channel] >= MAX_REPLIES_SECONDARY) {
    // Send a closing message redirecting to CRM
    await wsDelay(800);
    await showTyping(colleague.name.split(' ')[0], 1000);
    const closing = createMsgHTML(colleague, wsNow(),
      'Dai, ci sentiamo dopo — concentrati sulla pipeline che hai delle cose belle da vedere 💪',
      {}, channel);
    addMsgToChannel(channel, closing, {
      sender: colleagueKey,
      senderName: colleague.name,
      content: 'Dai, ci sentiamo dopo — concentrati sulla pipeline che hai delle cose belle da vedere.'
    });
    replyCountPerChannel[channel] = 999; // prevent further replies
    return;
  }

  replyCountPerChannel[channel]++;

  // Wait a brief moment before starting the typing sequence (mental reaction time)
  await wsDelay(300 + Math.random() * 300);

  let replyText = "";
  try {
    const response = await simFetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        message: userText,
        history: channelHistory[channel] || [],
        characterKey: colleagueKey
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    replyText = data.reply;

  } catch (err) {
    console.error('Failed to get dynamic reply from API, falling back to static:', err);
    // Safe fallbacks in case of network/key issues
    let fallbackText = "Ottimo! Concentriamoci sul lavoro e sul CRM adesso.";
    if (channel === 'welcome') {
      const welcomeReplies = [
        'Perfetto! Quando sei pronto, apri il CRM premendo il pulsante sopra.',
        'Grande! Se hai dubbi o domande, chiedimi pure qui.',
        'Ottimo. Ricorda che puoi guardare anche gli altri canali per raccogliere informazioni.'
      ];
      fallbackText = welcomeReplies[Math.floor(Math.random() * welcomeReplies.length)];
    } else if (channel === 'general') {
      fallbackText = "Benvenuto a bordo! In bocca al lupo per la giornata 🤞";
    } else if (channel === 'sales') {
      fallbackText = "Ciao! Ricordati che qualificare bene i lead è fondamentale prima di prenotare la demo.";
    } else if (channel === 'inbound') {
      fallbackText = "Ciao, per le campagne marketing e i lead inbound c'è un bel po' di movimento oggi.";
    }
    replyText = fallbackText;
  }

  // Now, split the replyText by '\n\n' (cascade/double-texting simulation)
  const blocks = replyText
    .split('\n\n')
    .map(b => b.trim())
    .filter(b => b.length > 0);

  // Send blocks sequentially
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Calculate typing speed based on length (e.g. 15ms per character, min 700ms, max 2200ms)
    const typingDuration = Math.min(2200, Math.max(700, block.length * 15));
    
    wsTypingText.textContent = `${colleague.name.split(' ')[0]} sta scrivendo…`;
    wsTypingBar.style.display = 'flex';
    
    await wsDelay(typingDuration);
    
    wsTypingBar.style.display = 'none';
    
    const replyMsg = createMsgHTML(colleague, wsNow(), block, {}, channel);
    addMsgToChannel(channel, replyMsg, {
      sender: colleagueKey,
      senderName: colleague.name,
      content: block
    });
    
    // Short break between messages to look natural
    if (i < blocks.length - 1) {
      await wsDelay(600 + Math.random() * 400);
    }
  }
}

// ── Background activity in #general ──
async function runBackgroundActivity() {
  await wsDelay(5000);

  const bg1 = createMsgHTML(team.andrea, '09:03', `Buona fortuna ${candidateName}! 🚀`, {}, 'general');
  addMsgToChannel('general', bg1, { sender: 'andrea', senderName: team.andrea.name, content: `Buona fortuna ${candidateName}! 🚀` });

  await wsDelay(7000);

  const bg2 = createMsgHTML(team.luca, '09:05', 'Qualcuno ha visto il lead di Edil Bianchi? Sembra interessante.', {}, 'general');
  addMsgToChannel('general', bg2, { sender: 'luca', senderName: team.luca.name, content: 'Qualcuno ha visto il lead di Edil Bianchi? Sembra interessante.' });

  await wsDelay(8000);

  const bg3 = createMsgHTML(team.marco, '09:08', 'Team, ricordatevi la sync alle 11:00. Portate i numeri aggiornati 📊', {}, 'general');
  addMsgToChannel('general', bg3, { sender: 'marco', senderName: team.marco.name, content: 'Team, ricordatevi la sync alle 11:00. Portate i numeri aggiornati 📊' });

  await wsDelay(12000);

  // Notification in #inbound
  const ib = createMsgHTML(team.andrea, '09:12', '🔔 Nuovo lead inbound: <em>Costruzioni Verdi Srl</em> ha visitato la pagina prezzi 3 volte oggi.', {}, 'inbound');
  addMsgToChannel('inbound', ib, { sender: 'andrea', senderName: team.andrea.name, content: '🔔 Nuovo lead inbound: Costruzioni Verdi Srl ha visitato la pagina prezzi 3 volte oggi.' });

  await wsDelay(10000);

  // Sales update
  const su = createMsgHTML(team.sara, '09:18', 'Update: Costruzioni Romani ha confermato la demo per domani alle 10:00 🎯', {}, 'sales');
  addMsgToChannel('sales', su, { sender: 'sara', senderName: team.sara.name, content: 'Update: Costruzioni Romani ha confermato la demo per domani alle 10:00 🎯' });
}

// ── Main workspace start ──
async function startSlackPhase() {
  analytics.slackReadStart = Date.now();

  // Get candidate name
  candidateName = analytics.candidate?.firstName || 'Candidato';

  // Personalize sidebar footer
  const initials = candidateName.charAt(0).toUpperCase();
  document.getElementById('ws-user-avatar').textContent = initials;
  document.getElementById('ws-user-name').textContent = candidateName;

  // Pre-populate other channels (silent — no sounds)
  prePopulateChannels();

  // Run welcome sequence + background activity in parallel
  runBackgroundActivity();
  await runWelcomeSequence();
}

// ── Analytics overlay ──
function showAnalytics() {
  const grid = document.getElementById('analytics-grid');
  const items = [
    { label: 'Tempo totale', value: formatTime(analytics.totalTime) },
    { label: 'Video Founder', value: formatTime(analytics.founderWatchTime) },
    { label: 'Lettura Workspace', value: formatTime(analytics.slackReadTime) },
    { label: 'Interazioni', value: String(analytics.interactions) },
  ];
  grid.innerHTML = items
    .map(i => `<div class="analytics-item">
      <div class="analytics-item-label">${i.label}</div>
      <div class="analytics-item-value">${i.value}</div>
    </div>`)
    .join('');
  document.getElementById('analytics-overlay').classList.remove('hidden');
}

document.getElementById('btn-close-analytics').addEventListener('click', () => {
  document.getElementById('analytics-overlay').classList.add('hidden');
});

document.addEventListener('click', () => analytics.interactions++);

// ── Start ──
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(runBoot, 200);
});
