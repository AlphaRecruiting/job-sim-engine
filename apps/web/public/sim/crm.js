/* ══════════════════════════════════════════
   Alpha × Pillar — CRM FASE 2
   Lead data, rendering, interactions, analytics
   ══════════════════════════════════════════ */

// ── Lead Data — 5 leads with realistic, deliberately incomplete info ──
const crmLeads = [
  {
    id: 'marchetti',
    company: 'Edilizia Marchetti Srl',
    contact: {
      name: 'Paolo Marchetti',
      role: 'Titolare',
      email: 'p.marchetti@edilmarchetti.it',
      phone: '+39 06 5523 8891',
    },
    sector: 'Costruzioni residenziali',
    employees: 45,
    revenue: '€8M',
    location: 'Roma, Lazio',
    founded: 2008,
    website: 'edilmarchetti.it',
    source: { type: 'Google Ads', icon: '🔍' },
    signalStrength: 'alto',
    avatarColor: 'linear-gradient(135deg,#6366f1,#818cf8)',
    activities: [
      { icon: '📝', text: 'Ha compilato il form "Richiedi demo"', date: '1 giorno fa' },
      { icon: '🌐', text: 'Ha visitato la pagina Prezzi (3 volte)', date: '2 giorni fa' },
      { icon: '🌐', text: 'Ha visitato la pagina Funzionalità', date: '3 giorni fa' },
    ],
    formNote: 'Nel form ha scritto: "Cerchiamo una soluzione per gestire i cantieri in modo più efficiente. Attualmente usiamo Excel."',
    interactions: [],
    missingInfo: ['Decisore tecnico non identificato', 'Budget IT annuale non disponibile'],
  },
  {
    id: 'greenbuild',
    company: 'GreenBuild SpA',
    contact: {
      name: 'Dott.ssa Francesca Lombardi',
      role: 'Responsabile Acquisti',
      email: 'f.lombardi@greenbuild.it',
      phone: '+39 02 8834 1205',
    },
    sector: 'Edilizia sostenibile',
    employees: 120,
    revenue: '€22M',
    location: 'Milano, Lombardia',
    founded: 2015,
    website: 'greenbuild.it',
    source: { type: 'LinkedIn Ads', icon: '💼' },
    signalStrength: 'medio',
    avatarColor: 'linear-gradient(135deg,#22c55e,#4ade80)',
    activities: [
      { icon: '📄', text: 'Ha scaricato il whitepaper "Digitalizzazione cantieri 2025"', date: '5 giorni fa' },
      { icon: '📝', text: 'Ha compilato il form contatto', date: '4 giorni fa' },
    ],
    formNote: 'Nel form ha indicato: "Sto esplorando soluzioni per il prossimo anno. Nessuna urgenza al momento."',
    interactions: [],
    missingInfo: ['Budget non dichiarato', 'Nessuna urgenza espressa', 'Decisore finale non chiaro (il Responsabile Acquisti potrebbe non decidere su software)'],
  },
  {
    id: 'ferraro',
    company: 'Costruzioni Ferraro & Figli',
    contact: {
      name: 'Marco Ferraro',
      role: 'Direttore Operativo',
      email: 'm.ferraro@ferrarocostruzioni.it',
      phone: '+39 011 4427 8830',
    },
    sector: 'Infrastrutture',
    employees: '200+',
    revenue: '€45M',
    location: 'Torino, Piemonte',
    founded: 1987,
    website: 'ferrarocostruzioni.it',
    source: { type: 'Referral', icon: '🤝' },
    signalStrength: 'alto',
    avatarColor: 'linear-gradient(135deg,#f97316,#fb923c)',
    activities: [
      { icon: '🤝', text: 'Referral diretto da EdilNova (cliente top Pillar)', date: '3 giorni fa' },
      { icon: '📧', text: 'Email ricevuta: "Ci ha parlato bene di voi il nostro partner EdilNova. Vorremmo capire come Pillar potrebbe aiutarci."', date: '2 giorni fa' },
      { icon: '🌐', text: 'Ha visitato la homepage e la pagina Case Study', date: '1 giorno fa' },
    ],
    formNote: null,
    interactions: [
      { text: 'Sara Ricci (AE) ha segnalato il contatto tramite EdilNova', date: '3 giorni fa' },
    ],
    missingInfo: ['Timeline del progetto non specificata'],
  },
  {
    id: 'parisi',
    company: 'Studio Tecnico Parisi',
    contact: {
      name: 'Ing. Davide Parisi',
      role: 'Ingegnere titolare',
      email: 'd.parisi@studioparisi.it',
      phone: '+39 081 7721 4490',
    },
    sector: 'Progettazione',
    employees: 8,
    revenue: '€600K',
    location: 'Napoli, Campania',
    founded: 2019,
    website: 'studioparisi.it',
    source: { type: 'Google Ads', icon: '🔍' },
    signalStrength: 'basso',
    avatarColor: 'linear-gradient(135deg,#a1a1aa,#d4d4d8)',
    activities: [
      { icon: '🌐', text: 'Ha visitato un articolo del blog', date: '6 giorni fa' },
      { icon: '📝', text: 'Ha compilato il form generico di contatto', date: '5 giorni fa' },
    ],
    formNote: 'Nel form ha scritto: "Vorrei informazioni sui vostri servizi."',
    interactions: [],
    missingInfo: ['Dimensione azienda molto ridotta (8 dipendenti)', 'Settore non core (progettazione, non costruzione)', 'Nessun segnale di intent specifico'],
  },
  {
    id: 'rossi',
    company: 'Rossi Infrastrutture Srl',
    contact: {
      name: 'Laura Rossi',
      role: 'Office Manager',
      email: 'l.rossi@rossiinfrastrutture.it',
      phone: '+39 055 2298 7712',
    },
    sector: 'Opere pubbliche',
    employees: 85,
    revenue: '€15M',
    location: 'Firenze, Toscana',
    founded: 2001,
    website: 'rossiinfrastrutture.it',
    source: { type: 'Evento', icon: '🎪' },
    signalStrength: 'medio',
    avatarColor: 'linear-gradient(135deg,#ec4899,#f472b6)',
    activities: [
      { icon: '🎪', text: 'Biglietto da visita raccolto allo stand Pillar (Fiera SAIE)', date: '1 settimana fa' },
      { icon: '💬', text: 'Ha detto allo stand: "Ci interessa, mandateci del materiale"', date: '1 settimana fa' },
    ],
    formNote: null,
    interactions: [],
    missingInfo: ['Il contatto è un Office Manager (non decisore)', 'Nessun follow-up digitale dopo la fiera', 'Interesse generico, non qualificato'],
  },
];

// ── CRM State ──
let crmCurrentLead = null;
let crmLeadViewStart = null;
let crmTimerInterval = null;
let crmRemainingSeconds = 900; // 15 minutes
let crmPriorityOrder = []; // array of lead IDs in priority order
let crmLeadNotes = {}; // { leadId: "text" }
let crmNoteSaveTimeout = null;
let crmPanelExpanded = false;
let crmCompleted = false;

// ── CRM Analytics (extends global analytics) ──
function initCRMAnalytics() {
  if (typeof analytics !== 'undefined') {
    analytics.crm = {
      startTime: Date.now(),
      leadsViewed: [],        // { leadId, viewedAt, duration }
      leadViewOrder: [],       // order of first views
      notesWritten: {},        // { leadId: "text" }
      priorityOrder: [],       // final order [leadId, ...]
      priorityMotivation: '',
      totalTimeInCRM: 0,
      sectionsToggled: [],     // { leadId, section, action }
    };
  }
}

// ══════════════════════════════════════════
// TIMER — 15 minute countdown
// ══════════════════════════════════════════
function startCRMTimer() {
  crmRemainingSeconds = 900;
  updateCRMTimerDisplay();
  crmTimerInterval = setInterval(() => {
    crmRemainingSeconds--;
    updateCRMTimerDisplay();
    if (crmRemainingSeconds <= 0) {
      clearInterval(crmTimerInterval);
      handleCRMTimeUp();
    }
  }, 1000);
}

function updateCRMTimerDisplay() {
  const m = Math.floor(crmRemainingSeconds / 60);
  const s = crmRemainingSeconds % 60;
  const text = `${m}:${String(s).padStart(2, '0')}`;
  const timerTextEl = document.getElementById('crm-timer-text');
  const timerEl = document.getElementById('crm-timer');
  if (timerTextEl) timerTextEl.textContent = text;

  if (timerEl) {
    timerEl.classList.remove('crm-timer-warning', 'crm-timer-danger');
    if (crmRemainingSeconds <= 120) {
      timerEl.classList.add('crm-timer-danger');
    } else if (crmRemainingSeconds <= 300) {
      timerEl.classList.add('crm-timer-warning');
    }
  }
}

function handleCRMTimeUp() {
  // Auto-complete with whatever state exists
  finalizeCRMAnalytics();
  showCRMComplete(true);
}

// ══════════════════════════════════════════
// LEAD LIST — Rendering
// ══════════════════════════════════════════
function renderLeadList(filter = '') {
  const list = document.getElementById('crm-lead-list');
  if (!list) return;
  list.innerHTML = '';

  const sourceFilter = document.getElementById('crm-filter-source')?.value || '';
  const searchTerm = document.getElementById('crm-search-input')?.value.toLowerCase() || '';

  const filtered = crmLeads.filter(lead => {
    if (sourceFilter && lead.source.type !== sourceFilter) return false;
    if (searchTerm) {
      const haystack = `${lead.company} ${lead.contact.name} ${lead.contact.role} ${lead.sector} ${lead.location}`.toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }
    return true;
  });

  filtered.forEach(lead => {
    const initials = lead.contact.name
      .split(' ')
      .map(w => w.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const priorityIndex = crmPriorityOrder.indexOf(lead.id);
    const card = document.createElement('div');
    card.className = `crm-lead-card${crmCurrentLead === lead.id ? ' selected' : ''}`;
    card.dataset.leadId = lead.id;
    card.innerHTML = `
      <div class="crm-lead-priority-badge${priorityIndex >= 0 ? ' visible' : ''}">${priorityIndex >= 0 ? priorityIndex + 1 : ''}</div>
      <div class="crm-lead-avatar" style="background:${lead.avatarColor}">${initials}</div>
      <div class="crm-lead-info">
        <span class="crm-lead-name">${lead.contact.name}</span>
        <span class="crm-lead-role">${lead.contact.role}</span>
        <span class="crm-lead-company">${lead.company}</span>
        <div class="crm-lead-meta">
          <span class="crm-lead-source">${lead.source.icon} ${lead.source.type}</span>
          <span class="crm-lead-location">${lead.location}</span>
          <span class="crm-lead-employees">${lead.employees} dip.</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => selectLead(lead.id));
    list.appendChild(card);
  });
}

// ══════════════════════════════════════════
// LEAD DETAIL — Right panel rendering
// ══════════════════════════════════════════
function selectLead(leadId) {
  const lead = crmLeads.find(l => l.id === leadId);
  if (!lead) return;

  // Track previous lead view duration
  if (crmCurrentLead && crmLeadViewStart && typeof analytics !== 'undefined') {
    const duration = Date.now() - crmLeadViewStart;
    analytics.crm.leadsViewed.push({
      leadId: crmCurrentLead,
      viewedAt: crmLeadViewStart,
      duration,
    });
  }

  crmCurrentLead = leadId;
  crmLeadViewStart = Date.now();

  // Track first view order
  if (typeof analytics !== 'undefined' && !analytics.crm.leadViewOrder.includes(leadId)) {
    analytics.crm.leadViewOrder.push(leadId);
  }

  // Update card selection
  document.querySelectorAll('.crm-lead-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.leadId === leadId);
  });

  // Hide empty state, show content
  const emptyEl = document.getElementById('crm-detail-empty');
  const contentEl = document.getElementById('crm-detail-content');
  if (emptyEl) emptyEl.style.display = 'none';
  if (contentEl) {
    contentEl.style.display = 'block';
    renderLeadDetail(lead);
  }

  // Update stats
  updateCRMStats();
}

function renderLeadDetail(lead) {
  const container = document.getElementById('crm-detail-content');
  if (!container) return;

  const initials = lead.contact.name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
  const isPrioritized = crmPriorityOrder.includes(lead.id);
  const savedNotes = crmLeadNotes[lead.id] || '';

  container.innerHTML = `
    <!-- Header -->
    <div class="crm-detail-header">
      <div class="crm-detail-contact-info">
        <div class="crm-detail-avatar" style="background:${lead.avatarColor}">${initials}</div>
        <div class="crm-detail-names">
          <span class="crm-detail-contact-name">${lead.contact.name}</span>
          <span class="crm-detail-contact-role">${lead.contact.role}</span>
        </div>
      </div>
      <span class="crm-detail-company">${lead.company}</span>
      <span class="crm-detail-sector-badge">${lead.source.icon} ${lead.source.type} · ${lead.sector}</span>
      <div class="crm-detail-contact-links">
        <span class="crm-detail-link">📧 ${lead.contact.email}</span>
        <span class="crm-detail-link">📞 ${lead.contact.phone}</span>
        ${lead.website ? `<span class="crm-detail-link">🌐 ${lead.website}</span>` : ''}
      </div>
    </div>

    <!-- Actions -->
    <div class="crm-detail-actions">
      <button class="crm-detail-btn crm-detail-btn-priority${isPrioritized ? ' added' : ''}" id="crm-btn-priority" data-lead-id="${lead.id}">
        ${isPrioritized ? '✓ Nella lista' : '+ Aggiungi alla priorità'}
      </button>
    </div>

    <!-- Section: Company Info -->
    <div class="crm-section" data-section="info-${lead.id}">
      <div class="crm-section-header" onclick="toggleCRMSection(this)">
        <span class="crm-section-title">Informazioni Azienda</span>
        <svg class="crm-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="crm-section-content">
        <div class="crm-info-grid">
          <div class="crm-info-item">
            <span class="crm-info-label">Settore</span>
            <span class="crm-info-value">${lead.sector}</span>
          </div>
          <div class="crm-info-item">
            <span class="crm-info-label">Dipendenti</span>
            <span class="crm-info-value">${lead.employees}</span>
          </div>
          <div class="crm-info-item">
            <span class="crm-info-label">Fatturato</span>
            <span class="crm-info-value">${lead.revenue}</span>
          </div>
          <div class="crm-info-item">
            <span class="crm-info-label">Sede</span>
            <span class="crm-info-value">${lead.location}</span>
          </div>
          <div class="crm-info-item">
            <span class="crm-info-label">Anno fondazione</span>
            <span class="crm-info-value">${lead.founded}</span>
          </div>
          <div class="crm-info-item">
            <span class="crm-info-label">Sito web</span>
            <span class="crm-info-value">${lead.website || '<span class="crm-info-missing">—</span>'}</span>
          </div>
        </div>
        ${lead.missingInfo.length > 0 ? `
        <div class="crm-missing-callout">
          <span class="crm-missing-callout-title">Informazioni mancanti</span>
          <ul class="crm-missing-list">
            ${lead.missingInfo.map(info => `<li>${info}</li>`).join('')}
          </ul>
        </div>` : ''}
      </div>
    </div>

    <!-- Section: Signals & Activities -->
    <div class="crm-section collapsed" data-section="signals-${lead.id}">
      <div class="crm-section-header" onclick="toggleCRMSection(this)">
        <span class="crm-section-title">Segnali & Attività</span>
        <svg class="crm-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="crm-section-content">
        <div class="crm-activity-list">
          ${lead.activities.map(a => `
            <div class="crm-activity-item">
              <span class="crm-activity-icon">${a.icon}</span>
              <div class="crm-activity-body">
                <span class="crm-activity-text">${a.text}</span>
                <span class="crm-activity-date">${a.date}</span>
              </div>
            </div>
          `).join('')}
        </div>
        ${lead.formNote ? `<div class="crm-activity-note">${lead.formNote}</div>` : ''}
      </div>
    </div>

    <!-- Section: Previous Interactions -->
    <div class="crm-section collapsed" data-section="interactions-${lead.id}">
      <div class="crm-section-header" onclick="toggleCRMSection(this)">
        <span class="crm-section-title">Interazioni precedenti</span>
        <svg class="crm-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="crm-section-content">
        ${lead.interactions.length > 0 ? `
          <div class="crm-activity-list">
            ${lead.interactions.map(i => `
              <div class="crm-activity-item">
                <span class="crm-activity-icon">📌</span>
                <div class="crm-activity-body">
                  <span class="crm-activity-text">${i.text}</span>
                  <span class="crm-activity-date">${i.date}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="crm-interactions-empty">Nessuna interazione precedente registrata</p>'}
      </div>
    </div>

    <!-- Section: Notes -->
    <div class="crm-section collapsed" data-section="notes-${lead.id}">
      <div class="crm-section-header" onclick="toggleCRMSection(this)">
        <span class="crm-section-title">Note</span>
        <svg class="crm-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="crm-section-content">
        <textarea class="crm-notes-area" id="crm-notes-${lead.id}" placeholder="Scrivi le tue note su questo lead..." data-lead-id="${lead.id}">${savedNotes}</textarea>
        <div class="crm-notes-saved" id="crm-notes-saved-${lead.id}">✓ Nota salvata</div>
      </div>
    </div>
  `;

  // Bind priority button
  const priorityBtn = document.getElementById('crm-btn-priority');
  if (priorityBtn) {
    priorityBtn.addEventListener('click', () => {
      toggleLeadPriority(lead.id);
    });
  }

  // Bind notes auto-save
  const notesArea = document.getElementById(`crm-notes-${lead.id}`);
  if (notesArea) {
    notesArea.addEventListener('input', (e) => {
      crmLeadNotes[lead.id] = e.target.value;
      if (typeof analytics !== 'undefined') {
        analytics.crm.notesWritten[lead.id] = e.target.value;
      }

      // Show "saved" indicator
      clearTimeout(crmNoteSaveTimeout);
      crmNoteSaveTimeout = setTimeout(() => {
        const savedEl = document.getElementById(`crm-notes-saved-${lead.id}`);
        if (savedEl) {
          savedEl.classList.add('visible');
          setTimeout(() => savedEl.classList.remove('visible'), 1500);
        }
        updateCRMStats();
      }, 400);
    });
  }
}

// ══════════════════════════════════════════
// SECTION TOGGLES
// ══════════════════════════════════════════
function toggleCRMSection(headerEl) {
  const section = headerEl.closest('.crm-section');
  if (!section) return;

  const isCollapsed = section.classList.contains('collapsed');
  section.classList.toggle('collapsed');

  // Track
  if (typeof analytics !== 'undefined') {
    analytics.crm.sectionsToggled.push({
      leadId: crmCurrentLead,
      section: section.dataset.section,
      action: isCollapsed ? 'open' : 'close',
      time: Date.now(),
    });
  }
}

// ══════════════════════════════════════════
// PRIORITY MANAGEMENT
// ══════════════════════════════════════════
function toggleLeadPriority(leadId) {
  const index = crmPriorityOrder.indexOf(leadId);
  if (index >= 0) {
    // Remove
    crmPriorityOrder.splice(index, 1);
  } else {
    // Add (max 5)
    if (crmPriorityOrder.length >= 5) return;
    crmPriorityOrder.push(leadId);
  }


  // Update UI
  renderPrioritySlots();
  updatePriorityCount();
  updateCRMStats();
  renderLeadList(); // refresh badges on cards

  // Re-select current lead to update priority button
  if (crmCurrentLead) {
    const lead = crmLeads.find(l => l.id === crmCurrentLead);
    if (lead) {
      // Update just the button, not the whole detail
      const btn = document.getElementById('crm-btn-priority');
      if (btn) {
        const isPrioritized = crmPriorityOrder.includes(leadId);
        btn.className = `crm-detail-btn crm-detail-btn-priority${isPrioritized ? ' added' : ''}`;
        btn.textContent = isPrioritized ? '✓ Nella lista' : '+ Aggiungi alla priorità';
      }
    }
  }

  // Check if confirm should be enabled
  checkConfirmEnabled();
}

function renderPrioritySlots() {
  const container = document.getElementById('crm-priority-slots');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const leadId = crmPriorityOrder[i] || null;
    const lead = leadId ? crmLeads.find(l => l.id === leadId) : null;
    const slot = document.createElement('div');
    slot.className = `crm-priority-slot${lead ? ' filled' : ''}`;
    slot.dataset.slotIndex = i;

    if (lead) {
      slot.draggable = true;
      slot.innerHTML = `
        <span class="crm-priority-slot-number">#${i + 1}</span>
        <div class="crm-priority-slot-content">
          <span class="crm-priority-slot-company">${lead.company}</span>
          <span class="crm-priority-slot-contact">${lead.contact.name}</span>
        </div>
        <button class="crm-priority-slot-remove" data-lead-id="${lead.id}" title="Rimuovi">×</button>
      `;

      // Remove button
      slot.querySelector('.crm-priority-slot-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLeadPriority(lead.id);
      });

      // Drag events
      slot.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(i));
        slot.style.opacity = '0.5';
      });
      slot.addEventListener('dragend', () => {
        slot.style.opacity = '1';
        document.querySelectorAll('.crm-priority-slot').forEach(s => s.classList.remove('drag-over'));
      });
    } else {
      slot.innerHTML = `
        <span class="crm-priority-slot-number">#${i + 1}</span>
      `;
    }

    // Drop events (for all slots)
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = i;
      if (fromIndex !== toIndex && crmPriorityOrder[fromIndex]) {
        // Swap
        const item = crmPriorityOrder.splice(fromIndex, 1)[0];
        crmPriorityOrder.splice(toIndex, 0, item);
        renderPrioritySlots();
        renderLeadList(); // refresh badges
      }
    });

    container.appendChild(slot);
  }
}

function updatePriorityCount() {
  const countEl = document.getElementById('crm-priority-count');
  if (countEl) {
    const len = crmPriorityOrder.length;
    const oldText = countEl.textContent;
    const newText = `${len} / 5`;
    
    countEl.textContent = newText;
    countEl.classList.toggle('highlighted', len > 0);
    
    if (oldText !== newText) {
      countEl.classList.remove('bounce-animation');
      void countEl.offsetWidth; // Force reflow
      countEl.classList.add('bounce-animation');
    }
  }
}

function checkConfirmEnabled() {
  // Sidebar confirm button — unlocks when all 5 leads are ranked
  const confirmBtn = document.getElementById('crm-priority-confirm');
  if (confirmBtn) {
    const ready = crmPriorityOrder.length === 5;
    confirmBtn.classList.toggle('enabled', ready);
    confirmBtn.disabled = !ready;
  }

  // Sheet submit button — unlocks when motivation text is long enough
  const submitBtn = document.getElementById('crm-priority-submit-final');
  const motivation = document.getElementById('crm-priority-motivation');
  if (submitBtn && motivation) {
    const hasText = motivation.value.trim().length > 10;
    submitBtn.classList.toggle('enabled', hasText);
    submitBtn.disabled = !hasText;
  }
}

// ══════════════════════════════════════════
// BOTTOM SHEET — explanation step
// ══════════════════════════════════════════
function openPrioritySheet() {
  document.getElementById('crm-priority-sheet')?.classList.add('open');
  document.getElementById('crm-sheet-backdrop')?.classList.add('open');
  setTimeout(() => document.getElementById('crm-priority-motivation')?.focus(), 350);
}

function closePrioritySheet() {
  document.getElementById('crm-priority-sheet')?.classList.remove('open');
  document.getElementById('crm-sheet-backdrop')?.classList.remove('open');
}

// ══════════════════════════════════════════
// CONFIRM & COMPLETE
// ══════════════════════════════════════════
function confirmPriority() {
  if (crmPriorityOrder.length < 5) return;
  if (crmCompleted) return;
  crmCompleted = true;

  const motivation = document.getElementById('crm-priority-motivation');
  finalizeCRMAnalytics();
  if (typeof analytics !== 'undefined' && motivation) {
    analytics.crm.priorityMotivation = motivation.value.trim();
  }

  clearInterval(crmTimerInterval);
  showCRMComplete(false);
}

function finalizeCRMAnalytics() {
  if (typeof analytics === 'undefined') return;

  // Track final lead view
  if (crmCurrentLead && crmLeadViewStart) {
    analytics.crm.leadsViewed.push({
      leadId: crmCurrentLead,
      viewedAt: crmLeadViewStart,
      duration: Date.now() - crmLeadViewStart,
    });
  }

  analytics.crm.priorityOrder = [...crmPriorityOrder];
  analytics.crm.totalTimeInCRM = Date.now() - analytics.crm.startTime;

  console.log('📊 CRM Analytics:', JSON.stringify(analytics.crm, null, 2));
}

function showCRMComplete(isTimeUp) {
  const phase = document.getElementById('phase-crm');
  if (!phase) return;

  let summaryHTML = '';
  if (crmPriorityOrder.length > 0) {
    summaryHTML = `
      <div class="crm-complete-summary">
        <span class="crm-complete-summary-title">La tua prioritizzazione</span>
        ${crmPriorityOrder.map((id, i) => {
          const lead = crmLeads.find(l => l.id === id);
          return lead ? `
            <div class="crm-complete-summary-item">
              <span class="crm-complete-summary-rank">${i + 1}</span>
              <span class="crm-complete-summary-name">${lead.company}</span>
            </div>
          ` : '';
        }).join('')}
      </div>
    `;
  }

  const overlay = document.createElement('div');
  overlay.className = 'crm-complete-overlay';
  overlay.id = 'crm-complete-overlay';
  overlay.innerHTML = `
    <div class="crm-complete-card">
      <div class="crm-complete-icon">${isTimeUp ? '⏱️' : '✅'}</div>
      <h3>${isTimeUp ? 'Tempo scaduto' : 'Prioritizzazione completata'}</h3>
      <p>${isTimeUp
        ? 'Il tempo a disposizione è terminato. Le tue scelte sono state salvate.'
        : 'Hai analizzato la pipeline inbound e stabilito le tue priorità.'
      }</p>
      ${summaryHTML}
      <p class="crm-complete-next">
        <span class="crm-complete-spinner"></span>
        Marco sta rivedendo le tue scelte...
      </p>
    </div>
  `;

  phase.appendChild(overlay);

  // After 4s, swap spinner for "next step" CTA
  setTimeout(() => {
    const nextEl = overlay.querySelector('.crm-complete-next');
    if (!nextEl) return;
    nextEl.innerHTML = `
      <button class="crm-complete-next-btn" id="crm-next-handover">
        Prossimo step: handover con l'AE
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    `;
    const btn = document.getElementById('crm-next-handover');
    if (btn) {
      btn.addEventListener('click', () => {
        if (typeof initHandover === 'function') {
          initHandover(crmPriorityOrder[0]);
        }
      });
    }
  }, 4000);
}

// ══════════════════════════════════════════
// SIDEBAR STATS
// ══════════════════════════════════════════
function updateCRMStats() {
  const viewedEl = document.getElementById('crm-stat-viewed');
  const notedEl = document.getElementById('crm-stat-noted');
  const prioEl = document.getElementById('crm-stat-prioritized');

  if (typeof analytics !== 'undefined') {
    const uniqueViewed = new Set(analytics.crm.leadViewOrder).size;
    const notedCount = Object.values(crmLeadNotes).filter(n => n.trim().length > 0).length;

    if (viewedEl) viewedEl.textContent = uniqueViewed;
    if (notedEl) notedEl.textContent = notedCount;
    if (prioEl) prioEl.textContent = crmPriorityOrder.length;
  }
}

// ══════════════════════════════════════════
// SEARCH & FILTER
// ══════════════════════════════════════════
function bindCRMFilters() {
  const searchInput = document.getElementById('crm-search-input');
  const sourceFilter = document.getElementById('crm-filter-source');

  if (searchInput) {
    searchInput.addEventListener('input', () => renderLeadList());
  }
  if (sourceFilter) {
    sourceFilter.addEventListener('change', () => renderLeadList());
  }
}

// ══════════════════════════════════════════
// EVENT BINDINGS
// ══════════════════════════════════════════
function bindCRMEvents() {

  // Sidebar confirm → open explanation sheet
  document.getElementById('crm-priority-confirm')?.addEventListener('click', openPrioritySheet);

  // Motivation textarea → re-check sheet submit state
  document.getElementById('crm-priority-motivation')?.addEventListener('input', checkConfirmEnabled);

  // Sheet submit → save motivation and complete
  document.getElementById('crm-priority-submit-final')?.addEventListener('click', confirmPriority);

  // Sheet close: backdrop, handle, X button
  document.getElementById('crm-sheet-backdrop')?.addEventListener('click', closePrioritySheet);
  document.getElementById('crm-sheet-handle-bar')?.addEventListener('click', closePrioritySheet);
  document.getElementById('crm-sheet-close-btn')?.addEventListener('click', closePrioritySheet);

  // Search & filter
  bindCRMFilters();
}

// ══════════════════════════════════════════
// INIT — Called from app.js when CRM opens
// ══════════════════════════════════════════
function initCRM() {
  initCRMAnalytics();

  // Set user avatar
  if (typeof candidateName !== 'undefined') {
    const avatar = document.getElementById('crm-user-avatar');
    if (avatar && candidateName) {
      avatar.textContent = candidateName.charAt(0).toUpperCase();
    }
  }

  // Render
  renderLeadList();
  renderPrioritySlots();
  updatePriorityCount();
  updateCRMStats();

  // Bind events
  bindCRMEvents();

  // Start timer
  startCRMTimer();

  // Auto-select first lead after a moment
  setTimeout(() => selectLead(crmLeads[0].id), 600);
}

// Expose initCRM globally
window.initCRM = initCRM;
