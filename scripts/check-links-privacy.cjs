const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage(); const errors = [], calls = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { localStorage.setItem('adminToken', 'fixture-only'); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copiedMessage = text; } } }); });
  const now = new Date().toISOString(); let paid = false;
  let replies = [{ _id: 'r1', keyword: 'welcome', response: 'Hello! How can we help?' }];
  const conversation = { _id: 'c1', contact: { name: 'Ada Customer', phone: '2348101234569' }, assignedTo: null, status: 'open', labels: [], lastInboundAt: now, lastMessageAt: now, ai: { active: false, state: { currentSalesStage: 'DISCOVERY', selectedPlatform: 'tiktok' } } };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), p = url.pathname.replace('/api/inbox', ''), body = route.request().postDataJSON(); let result = {};
    if (p === '/session') result = { actor: { admin: false, id: 'staff1', role: 'CSS', name: 'Administrator' }, staff: [], provider: { configured: true } };
    else if (p === '/events-ticket') return route.fulfill({ status: 503, json: {} });
    else if (p === '/notifications') result = { items: [], unread: 0 };
    else if (p === '/counts') result = { inbox: 1 };
    else if (p === '/conversations') result = { items: [conversation], next: null };
    else if (p === '/conversations/c1') result = conversation;
    else if (p.endsWith('/messages')) result = { items: [{_id:'original',providerId:'wamid.original',status:'received',type:'text',direction:'inbound',text:'Visit https://example.com/help and www.example.org.',createdAt:now},{_id:'out',providerId:'wamid.out',status:'delivered',type:'document',media:{id:'fixture-media',name:'brief.pdf'},direction:'outbound',authorName:'Administrator',text:'Our reply',createdAt:now}], more: false };
    else if (p.endsWith('/media-info')) result = {state:'ready',keep:false};
    else if (p.endsWith('/media-link')) result = {source:'r2',url:'data:application/pdf;base64,JVBERg=='};
    else if (p.endsWith('/media-keep')) { calls.push(body); result = {state:'pending',keep:true}; }
    else if (p.endsWith('/crm')) result = [];
    else if (p === '/quick-replies') { if (body) { replies.push({ ...body, _id: 'r2' }); } result = { items: replies }; }
    else if (p === '/admin-contacts') result = { items: [{ _id: 'contact', name: 'Ada Customer', phone: '2348101234569' }], next: null };
    else if (p.endsWith('/actions/customer')) result = { name: 'Ada Customer', phone: '+2348101234569' };
    else if (p.endsWith('/actions/payment')) { result = { paid, status: paid ? 'paid' : 'pending', amount: 25000 }; paid = true; }
    else if (p.endsWith('/actions/invoice')) { calls.push(body); result = { queued: true }; }
    else if (p.includes('/actions/crm/')) { calls.push(body); result = { saved: true }; }
    await route.fulfill({ json: result });
  });
  try {
    await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3005/crm-inbox');
    await page.getByRole('button',{name:/Ada Customer/}).click();
    const link=page.locator('article a[href="https://example.com/help"]');await link.waitFor();
    assert.equal(await page.locator('article a[href="https://www.example.org"]').count(),1);
    assert.equal(await page.locator('body').innerText().then(t=>t.includes('2348101234569')),false);
    assert.ok((await page.locator('body').innerText()).includes('+23481*******9'));
    await page.getByRole('button',{name:'Customer details',exact:true}).click();
    assert.equal(await page.locator('a[href^="tel:"]').count(),0);
    assert.equal(await page.locator('body').innerText().then(t=>t.includes('2348101234569')),false);
    assert.deepEqual(errors,[]);console.log('PASS: clickable links and masked staff header/details without telephone links');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
