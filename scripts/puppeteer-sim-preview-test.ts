/**
 * Puppeteer smoke test for the consolidated SDR simulation served at /sim/.
 * Verifies preview mode UI, TTS audio, the colleague chat (/api/chat), and
 * that the CRM + handover phases render. Runs against the deployed web app.
 *
 * Usage:
 *   npx tsx scripts/puppeteer-sim-preview-test.ts [BASE_URL]
 */

import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';

const BASE = process.argv[2] || process.env.WEB_URL || 'https://web-production-a52d7.up.railway.app';
const HEADLESS = process.env.HEADLESS !== 'false';

let browser: Browser;
let page: Page;

const results: { name: string; ok: boolean; detail: string }[] = [];
function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// Records API responses observed during the run
const api: Record<string, { status: number; ct: string }[]> = { tts: [], chat: [] };

async function run() {
  const { mkdirSync } = await import('fs');
  mkdirSync('scripts/screenshots', { recursive: true });

  browser = await puppeteer.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1280, height: 900 },
  });
  page = await browser.newPage();

  page.on('response', (res: HTTPResponse) => {
    const u = res.url();
    if (u.includes('/api/tts')) api.tts.push({ status: res.status(), ct: res.headers()['content-type'] || '' });
    if (u.includes('/api/chat')) api.chat.push({ status: res.status(), ct: res.headers()['content-type'] || '' });
  });

  const url = `${BASE}/sim/index.html?preview=true`;
  console.log(`\n=== Loading ${url} ===`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#btn-start-sim', { timeout: 20000 });
  await page.screenshot({ path: 'scripts/screenshots/sim-01-boot.png' });

  // ── 1. Preview UI ──
  const previewBadge = await page.$eval('#preview-badge', el => el.classList.contains('active')).catch(() => false);
  check('Preview badge active', previewBadge);

  const bootBanner = await page.$('.boot-preview-banner');
  check('Boot preview banner present', !!bootBanner);

  const startText = await page.$eval('#btn-start-sim', el => el.textContent?.toLowerCase() || '');
  check('Start button says "anteprima"', startText.includes('anteprima'), `"${startText.trim()}"`);

  // ── 2. Start → founder phase + TTS ──
  await page.click('#btn-start-sim');
  await page.waitForFunction(() => document.getElementById('phase-founder')?.classList.contains('active'), { timeout: 20000 })
    .catch(() => {});
  const founderActive = await page.$eval('#phase-founder', el => el.classList.contains('active')).catch(() => false);
  check('Founder phase active after start', founderActive);

  // Give TTS a moment to fire
  await wait(6000);
  await page.screenshot({ path: 'scripts/screenshots/sim-02-founder.png' });
  const ttsOk = api.tts.length > 0 && api.tts.every(r => r.status === 200);
  check('TTS /api/tts returns 200 audio', ttsOk,
    `${api.tts.length} calls, statuses=[${api.tts.map(r => r.status).join(',')}], ct=${api.tts[0]?.ct || '-'}`);

  // ── 3. Colleague chat via /api/chat ──
  // Jump straight to the workspace and exercise the chat input.
  await page.evaluate(() => {
    (window as any).showPhase('phase-slack');
    (window as any).activeChannel = 'welcome';
    const inp = document.getElementById('ws-input') as HTMLInputElement | null;
    const btn = document.getElementById('ws-send') as HTMLButtonElement | null;
    if (inp) inp.disabled = false;
    if (btn) btn.disabled = false;
  });
  await wait(500);
  await page.type('#ws-input', 'Ciao Marco, sono pronto a iniziare la giornata!', { delay: 15 });
  const chatBefore = api.chat.length;
  await page.evaluate(() => (window as any).sendCandidateMessage());

  // Wait for a chat API response
  await page.waitForFunction(
    (before: number) => (window as any).__chatSeen === undefined && true && before >= 0,
    { timeout: 1000 }, chatBefore
  ).catch(() => {});
  const deadline = Date.now() + 20000;
  while (api.chat.length === chatBefore && Date.now() < deadline) await wait(500);
  await wait(1500);
  await page.screenshot({ path: 'scripts/screenshots/sim-03-chat.png' });

  const chatOk = api.chat.length > chatBefore && api.chat.slice(chatBefore).every(r => r.status === 200);
  check('Chat /api/chat returns 200', chatOk,
    `${api.chat.length - chatBefore} call(s), statuses=[${api.chat.slice(chatBefore).map(r => r.status).join(',')}]`);

  const replyRendered = await page.evaluate(() => {
    const msgs = Array.from(document.querySelectorAll('#ws-messages .ws-msg, #ws-messages-scroll .ws-msg'));
    return msgs.length;
  });
  check('Chat messages rendered in workspace', replyRendered > 0, `${replyRendered} message bubbles`);

  // ── 4. CRM phase renders ──
  await page.evaluate(() => (window as any).showPhase('phase-crm'));
  await wait(1500);
  await page.screenshot({ path: 'scripts/screenshots/sim-04-crm.png' });
  const crmRendered = await page.evaluate(() => {
    return document.querySelectorAll('#phase-crm [class*="lead"], #phase-crm tr, #phase-crm [draggable]').length;
  });
  check('CRM phase renders lead content', crmRendered > 0, `${crmRendered} lead-related nodes`);

  // ── 5. Handover phase renders ──
  const handoverOk = await page.evaluate(() => {
    try {
      if (typeof (window as any).initHandover === 'function') (window as any).initHandover('lead-roberto');
      else (window as any).showPhase('phase-handover');
      return document.getElementById('phase-handover')?.classList.contains('active') || false;
    } catch { return false; }
  });
  await wait(1500);
  await page.screenshot({ path: 'scripts/screenshots/sim-05-handover.png' });
  check('Handover phase active', handoverOk);

  // ── Summary ──
  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.ok).length;
  console.log(`${passed}/${results.length} checks passed`);
  console.log(`TTS calls: ${JSON.stringify(api.tts)}`);
  console.log(`Chat calls: ${JSON.stringify(api.chat)}`);

  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
}

run().catch(async (e) => {
  console.error('[FATAL]', e.message);
  if (page) await page.screenshot({ path: 'scripts/screenshots/sim-fatal.png' }).catch(() => {});
  if (browser) await browser.close().catch(() => {});
  process.exit(1);
});
