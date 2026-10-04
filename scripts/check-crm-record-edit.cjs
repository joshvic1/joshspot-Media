const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage(); const errors = [], calls = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { localStorage.setItem('adminToken', 'fixture-only'); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copiedMessage = text; } } }); });
  const now = new Date().toISOString(); let paid = false;
  let replies = [{ _id: 'r1', keyword: 'welcome', response: 'Hello! How can we help?' }];
  const conversation = { _id: 'c1', contact: { name: 'Ada Customer', phone: '2348000000000' }, assignedTo: null, status: 'open', labels: [], lastInboundAt: now, lastMessageAt: now, ai: { active: false, state: { currentSalesStage: 'DISCOVERY', selectedPlatform: 'tiktok' } } };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), p = url.pathname.replace('/api/inbox', ''), body = route.request().postDataJSON(); let result = {};
    if (p === '/session') result = { actor: { admin: true, id: 'admin', role: 'ADMIN', name: 'Administrator' }, staff: [], provider: { configured: true } };
    else if (p === '/events-ticket') return route.fulfill({ status: 503, json: {} });
    else if (p === '/notifications') result = { items: [], unread: 0 };
    else if (p === '/counts') result = { inbox: 1 };
    else if (p === '/conversations') result = { items: [conversation], next: null };
    else if (p === '/conversations/c1') result = conversation;
    else if (p.endsWith('/messages')) result = { items: [{_id:'original',providerId:'wamid.original',status:'received',type:'text',direction:'inbound',text:'Original customer message',createdAt:now},{_id:'out',providerId:'wamid.out',status:'delivered',type:'document',media:{id:'fixture-media',name:'brief.pdf'},direction:'outbound',authorName:'Administrator',text:'Our reply',createdAt:now}], more: false };
    else if (p.endsWith('/media-info')) result = {state:'ready',keep:false};
    else if (p.endsWith('/media-link')) result = {source:'r2',url:'data:application/pdf;base64,JVBERg=='};
    else if (p.endsWith('/media-keep')) { calls.push(body); result = {state:'pending',keep:true}; }
    else if (p.endsWith('/crm')) result = [];
    else if (p === '/quick-replies') { if (body) { replies.push({ ...body, _id: 'r2' }); } result = { items: replies }; }
    else if (p === '/admin-contacts') result = { items: [{ _id: 'contact', name: 'Ada Customer', phone: '2348000000000' }], next: null };
    else if (p.endsWith('/actions/customer')) result = { name: 'Ada Customer', phone: '+2348000000000' };
    else if (p.endsWith('/actions/payment')) { result = { paid, status: paid ? 'paid' : 'pending', amount: 25000 }; paid = true; }
    else if (p.endsWith('/actions/invoice')) { calls.push(body); result = { queued: true }; }
    else if (p.includes('/actions/crm/')) { if(route.request().method()==='GET') result={record:{_id:'saved1',servicePaidFor:'Meta ads setup',clientLoginDetails:'Existing details',landingPageLink:'https://example.com'}}; else {calls.push({method:route.request().method(),path:p,body});result={saved:true};} }
    await route.fulfill({ json: result });
  });
  try {
    await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3005/crm-inbox');await page.getByRole('button',{name:/Ada Customer/}).click();
    await page.getByLabel('Message tools',{exact:true}).click();await page.getByRole('button',{name:'Chat actions',exact:true}).click();
    await page.getByRole('button',{name:/Add to CRM/}).click();await page.getByRole('button',{name:/^Setup/}).click();
    await page.getByRole('dialog',{name:'Edit Setup client'}).waitFor();assert.equal(await page.locator('label').filter({hasText:'Client login details'}).locator('textarea').inputValue(),'Existing details');
    await page.locator('label').filter({hasText:'Client login details'}).locator('textarea').fill('Updated details');await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByText('Client details saved',{exact:true}).waitFor();assert.equal(calls.at(-1).method,'PUT');assert.ok(calls.at(-1).path.endsWith('/setup/saved1'));assert.equal(calls.at(-1).body.clientLoginDetails,'Updated details');
    assert.deepEqual(errors,[]);console.log('PASS: Setup reopens saved details and updates the existing record');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

