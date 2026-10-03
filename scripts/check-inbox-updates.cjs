const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const now = new Date().toISOString(); let admin = true; let posted; let read = false; let olderCalls = 0; let nextCalls = 0;
  const rows = Array.from({ length: 40 }, (_, i) => ({ _id: `conversation${i}`, contact: { name: `Customer ${i}`, phone: '2348000000000' }, assignedTo: 'staff1', status: 'open', lastMessageAt: now, lastInboundAt: now, preview: 'Recent message', revision: 0 }));
  const recent = { _id: '100', direction: 'inbound', type: 'text', text: 'Recent message body', createdAt: now };
  const older = { _id: '050', direction: 'internal', type: 'note', text: 'Please review this customer', authorName: 'Administrator', mentions: ['staff1'], createdAt: new Date(Date.now() - 4 * 86400000).toISOString() };
  await page.route('**/*', async route => {
    const u = new URL(route.request().url()); if (u.hostname !== 'localhost') return route.fulfill({ body: '' });
    if (!u.pathname.startsWith('/api/inbox')) return route.continue();
    const p = u.pathname.slice(10); let body;
    if (p === '/session') body = { actor: { id: admin ? 'admin' : 'staff1', admin, name: admin ? 'Administrator' : 'Trisha', role: admin ? 'ADMIN' : 'CSS' }, staff: [{ _id: 'staff1', name: 'Trisha', role: 'CSS' }], provider: { configured: true } };
    else if (p === '/events-ticket') return route.fulfill({ status: 503, json: { message: 'Offline fixture' } });
    else if (p === '/counts') body = { inbox: 40 };
    else if (p === '/notifications') body = { items: [{ _id: 'n1', conversation: 'conversation0', message: '050', authorName: 'Administrator', createdAt: now, readAt: read ? now : null }], unread: read ? 0 : 1, next: null };
    else if (p === '/notifications/n1/read') { read = true; body = { conversation: 'conversation0', message: '050' }; }
    else if (p === '/conversations') { const next = u.searchParams.has('before'); if (next) nextCalls++; body = { items: rows.slice(next ? 20 : 0, next ? 40 : 20), next: next ? null : 'page2' }; }
    else if (p.endsWith('/messages')) {
      if (route.request().method() === 'POST') { posted = route.request().postDataJSON(); body = { _id: '101' }; }
      else if (u.searchParams.has('target')) body = { items: [older], next: null, more: false, changes: 'delta' };
      else if (u.searchParams.has('page')) { olderCalls++; body = { items: [older], next: null, more: false, changes: 'delta' }; }
      else if (u.searchParams.has('changes')) body = { items: posted ? [{ ...older, _id: '101', text: posted.text, mentions: posted.mentions }] : [], more: false, changes: 'delta' };
      else body = { items: [recent], more: true, next: 'older', withinDay: false, changes: 'delta' };
    } else if (p.endsWith('/crm')) body = [];
    else if (p.startsWith('/conversations/')) body = rows[0];
    else throw Error(`Unexpected ${p}`);
    await route.fulfill({ json: body });
  });
  await page.goto('http://localhost:3005/crm-inbox');
  await page.getByRole('button', { name: /Customer 19/ }).waitFor();
  assert.equal(await page.locator('section[aria-label="Conversations"] button[aria-pressed]').count(), 20);
  assert.equal(nextCalls, 0);
  await page.locator('div[aria-busy]').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.getByRole('button', { name: /Customer 39/ }).waitFor(); assert.equal(nextCalls, 1);
  await page.getByRole('button', { name: /Customer 0 / }).click();
  await page.getByText('Recent message body', { exact: true }).waitFor();
  assert.equal(await page.getByText(older.text, { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Load previous 24 hours' }).click();
  await page.getByText(older.text, { exact: true }).waitFor(); assert.equal(olderCalls, 1);
  await page.getByRole('button', { name: 'Write internal note', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel internal note', exact: true }).click();
  await page.getByRole('button', { name: 'Write internal note', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '@ Tag staff' }).count(), 0);
  const editor = page.getByRole('textbox', { name: 'Internal note', exact: true });
  await editor.pressSequentially('Hello @Tri');
  await page.getByRole('option', { name: /Trisha/ }).waitFor();
  await page.screenshot({ path: 'artifacts/inbox/mention-picker-mobile.png' });
  await editor.press('Enter');
  assert.equal(await editor.locator('strong').innerText(), '@Trisha');
  await editor.pressSequentially('please check this customer');
  assert.equal(await editor.locator('strong').innerText(), '@Trisha');
  await page.getByRole('button', { name: 'Send internal note', exact: true }).click();
  await page.getByText('Hello @Trisha please check this customer', { exact: true }).waitFor();
  assert.equal(await page.locator('#message-101 strong').innerText(), '@Trisha');
  assert.deepEqual(posted.mentions, ['staff1']); assert.equal(posted.type, 'note');
  await page.screenshot({ path: 'artifacts/inbox/mentions-mobile.png' });
  await editor.pressSequentially('@Tri');
  await page.getByRole('option', { name: /Trisha/ }).click();
  await editor.press('ControlOrMeta+A'); await editor.press('Backspace');
  await editor.pressSequentially('A note without a tag');
  await page.getByRole('button', { name: 'Send internal note', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[role="textbox"][aria-label="Internal note"]').innerText === '');
  assert.deepEqual(posted.mentions, []);
  admin = false; await page.reload();
  await page.getByRole('navigation', { name: 'Mobile Inbox navigation' }).getByRole('button', { name: /Alerts/ }).click();
  await page.getByText('Administrator mentioned you').waitFor();
  await page.screenshot({ path: 'artifacts/inbox/notifications-mobile.png' });
  await page.getByRole('button', { name: /Administrator mentioned you/ }).click();
  await page.locator('#message-050').waitFor(); assert(read);
  assert((await page.locator('#message-050').getAttribute('class')).includes('highlightNote'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log('PASS: 20-row scroll pagination, 24-hour history, mention payload, notification badge/list/read/deep link, mobile overflow.');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
