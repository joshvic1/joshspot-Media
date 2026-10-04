const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage(); const errors = [], calls = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('adminToken', 'fixture-only'));
  const now = new Date().toISOString(); let paid = false;
  let replies = [{ _id: 'r1', keyword: 'welcome', response: 'Hello! How can we help?' }];
  const conversation = { _id: 'c1', contact: { name: 'Ada Customer', phone: '2348000000000' }, assignedTo: null, status: 'open', labels: [], lastInboundAt: now, lastMessageAt: now, ai: { active: false, state: { currentSalesStage: 'DISCOVERY', selectedPlatform: 'tiktok' } } };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), p = url.pathname.replace('/api/inbox', ''), body = route.request().postDataJSON(); let result = {};
    if (p === '/session') result = { actor: { admin: true, id: 'admin', role: 'ADMIN', name: 'Administrator' }, staff: [], provider: { configured: true } };
    else if (p === '/events-ticket') return route.fulfill({ status: 503, json: {} });
    else if (p === '/notifications') result = { items: [], unread: 0 };
    else if (p === '/counts') result = { inbox: 1 };
    else if (p === '/conversations') result = { items: [{...conversation,ai:{priority:true,needsHuman:true}}, {...conversation,_id:'c2',contact:{name:'Assigned Customer'},assignedTo:'staff1'}], next: null };
    else if (p === '/conversations/c1') result = conversation;
    else if (p.endsWith('/messages') && route.request().method() === 'POST') { await new Promise(resolve => setTimeout(resolve, 1600)); result = { queued: true }; }
    else if (p.endsWith('/messages')) result = { items: [...['queued','sent','delivered','read'].map(status=>({_id:status,providerId:'wamid.'+status,status,type:'text',direction:'outbound',text:'Status '+status,createdAt:now})),{_id:'original',providerId:'wamid.original',status:'received',type:'text',direction:'inbound',text:'Original customer message',createdAt:now},{_id:'out',providerId:'wamid.out',status:'delivered',type:'document',media:{id:'fixture-media',name:'brief.pdf'},direction:'outbound',authorName:'Administrator',text:'Our reply',createdAt:now}], more: false };
    else if (p.endsWith('/media-info')) result = {state:'ready',keep:false};
    else if (p.endsWith('/media-link')) result = {source:'r2',url:'data:application/pdf;base64,JVBERg=='};
    else if (p.endsWith('/media-keep')) { calls.push(body); result = {state:'pending',keep:true}; }
    else if (p.endsWith('/crm')) result = [];
    else if (p === '/quick-replies') { if (body) { replies.push({ ...body, _id: 'r2' }); } result = { items: replies }; }
    else if (p === '/admin-contacts') result = { items: [{ _id: 'contact', name: 'Ada Customer', phone: '2348000000000' }], next: null };
    else if (p.endsWith('/actions/customer')) result = { name: 'Ada Customer', phone: '+2348000000000' };
    else if (p.endsWith('/actions/payment')) { result = { paid, status: paid ? 'paid' : 'pending', amount: 25000 }; paid = true; }
    else if (p.endsWith('/actions/invoice')) { calls.push(body); result = { queued: true }; }
    else if (p.includes('/actions/crm/')) { calls.push(body); result = { saved: true }; }
    await route.fulfill({ json: result });
  });
  try {
    await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3005/crm-inbox');
    const row=page.getByRole('button',{name:/Ada Customer/});await row.waitFor();
    assert.equal(await row.getByRole('img',{name:'Unassigned conversation'}).count(),1);
    assert.equal(await row.getByText('Unassigned',{exact:true}).count(),0);
    await row.getByText('Payment',{exact:true}).waitFor();await row.getByText('Needs human',{exact:true}).waitFor();
    const assigned=page.getByRole('button',{name:/Assigned Customer/});assert.equal(await assigned.getByRole('img',{name:'Unassigned conversation'}).count(),0);
    for(const width of [360,390,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    assert.deepEqual(errors,[]);console.log('PASS: compact unassigned sparkle, no assignment text, payment/human tags retained, mobile and desktop');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
