/* ══════════════════════════════════════════
   Alpha × Pillar — HANDOVER FASE (DM con AE)
   ══════════════════════════════════════════ */

const saraMember = {
  name: 'Sara Ricci',
  initials: 'SR',
  color: 'linear-gradient(135deg,#ec4899,#db2777)',
};

let handoverSent = false;

function handoverNow() {
  const d = new Date();
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function handoverDelay(ms) { return new Promise(r => setTimeout(r, ms)); }

function createHandoverMsg(member, time, html) {
  const div = document.createElement('div');
  div.className = 'ws-msg';
  div.innerHTML = `
    <div class="ws-msg-avatar" style="background:${member.color}">${member.initials}</div>
    <div class="ws-msg-body">
      <div class="ws-msg-header">
        <span class="ws-msg-name">${member.name}</span>
        <span class="ws-msg-time">${time}</span>
      </div>
      <div class="ws-msg-text">${html}</div>
    </div>
  `;
  return div;
}

async function initHandover(topLeadId) {
  const lead = (typeof crmLeads !== 'undefined') ? crmLeads.find(l => l.id === topLeadId) : null;

  showPhase('phase-handover');

  const firstName = (typeof candidateName !== 'undefined' && candidateName) ? candidateName : 'Tu';
  const leadCompany = lead ? lead.company : 'il lead';
  const contactName = lead ? lead.contact.name : 'il contatto';

  // Context banner
  const ctxEl = document.getElementById('handover-context-text');
  if (ctxEl) {
    ctxEl.innerHTML = `Hai appena concluso la chiamata con <strong>${contactName}</strong> di <strong>${leadCompany}</strong>. Ora aggiorna Sara, la tua Account Executive.`;
  }

  // Sidebar user footer
  const avatar = document.getElementById('handover-user-avatar');
  if (avatar) avatar.textContent = firstName.charAt(0).toUpperCase();
  const nameEl = document.getElementById('handover-user-name');
  if (nameEl) nameEl.textContent = firstName;

  const messagesEl = document.getElementById('handover-messages');
  const scrollEl  = document.getElementById('handover-scroll');
  const typingBar = document.getElementById('handover-typing-bar');
  const inputEl   = document.getElementById('handover-input');
  const sendBtn   = document.getElementById('handover-send');

  function scrollBottom() {
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  async function showTyping(ms) {
    if (typingBar) typingBar.style.display = 'flex';
    await handoverDelay(ms);
    if (typingBar) typingBar.style.display = 'none';
  }

  function appendMsg(el) {
    if (messagesEl) { messagesEl.appendChild(el); scrollBottom(); }
    if (typeof playNotifSound === 'function') playNotifSound();
  }

  await handoverDelay(700);

  // Sara: opening
  await showTyping(1800);
  appendMsg(createHandoverMsg(saraMember, handoverNow(),
    `Ciao ${firstName}! Ho visto che dovevi chiamare <strong>${contactName}</strong> di <strong>${leadCompany}</strong>. Com'è andata? 👀`));

  await handoverDelay(900);

  // Sara: what she needs
  await showTyping(1600);
  appendMsg(createHandoverMsg(saraMember, handoverNow(),
    `Dammi un update veloce: <strong>livello di interesse</strong>, <strong>pain point principale</strong> e se c'è già una <strong>data disponibile per la demo</strong> 📅`));

  // Enable input
  if (inputEl) { inputEl.disabled = false; inputEl.focus(); }
  if (sendBtn) sendBtn.disabled = false;

  function sendHandover() {
    const text = inputEl?.value.trim();
    if (!text || handoverSent) return;
    handoverSent = true;

    if (typeof playSendSound === 'function') playSendSound();

    const me = {
      name: firstName,
      initials: firstName.charAt(0).toUpperCase(),
      color: 'linear-gradient(135deg,#f97316,#ef4444)',
    };
    appendMsg(createHandoverMsg(me, handoverNow(), text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')));

    if (inputEl) { inputEl.value = ''; inputEl.disabled = true; }
    if (sendBtn) sendBtn.disabled = true;

    if (typeof analytics !== 'undefined') {
      analytics.handover = { message: text, sentAt: Date.now(), leadId: topLeadId };
    }

    setTimeout(() => replyFromSara(lead, text, appendMsg, showTyping), 500);
  }

  if (sendBtn) sendBtn.addEventListener('click', sendHandover);
  if (inputEl) {
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendHandover(); }
    });
  }
}

async function replyFromSara(lead, candidateText, appendMsg, showTyping) {
  const leadCompany = lead ? lead.company : 'il lead';
  let replyText = '';

  try {
    const res = await (window.simFetch || fetch)('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'dm_sara',
        message: candidateText,
        history: [],
        characterKey: 'sara',
        context: `Sei Sara Ricci, Account Executive di Pillar. Hai ricevuto un handover dall'SDR dopo una chiamata con ${leadCompany}. Ringrazia l'SDR, conferma di aver capito le info chiave e dì che ti occupi di organizzare la demo. Sii calorosa e diretta. Max 2 brevi paragrafi.`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      replyText = data.reply;
    }
  } catch (e) {
    console.warn('Handover API fallback:', e);
  }

  if (!replyText) {
    replyText = `Perfetto, grazie mille! Ho tutto quello che mi serve per preparare una demo mirata 🎯\n\nProvvedo subito a contattarli per trovare una slot. Ottimo lavoro sulla qualifica!`;
  }

  const blocks = replyText.split('\n\n').map(b => b.trim()).filter(Boolean);
  for (let i = 0; i < blocks.length; i++) {
    await showTyping(Math.min(2000, Math.max(900, blocks[i].length * 14)));
    appendMsg(createHandoverMsg(saraMember, handoverNow(), blocks[i]));
    if (i < blocks.length - 1) await handoverDelay(600);
  }

  // Show completion banner
  await handoverDelay(1200);
  const banner = document.getElementById('handover-complete-banner');
  if (banner) banner.classList.add('visible');
}

window.initHandover = initHandover;
