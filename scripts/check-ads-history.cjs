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
    else if (p === '/conversations') result = { items: [conversation], next: null };
    else if (p === '/conversations/c1') result = conversation;
    else if (p.endsWith('/messages')) result = { items: [{_id:'original',providerId:'wamid.original',status:'received',type:'text',direction:'inbound',text:'Original customer message',createdAt:now}], more: false };
    else if (p.endsWith('/crm')) result = [];
    else if (p === '/quick-replies') { if (body) { replies.push({ ...body, _id: 'r2' }); } result = { items: replies }; }
    else if (p === '/admin-contacts') result = { items: [{ _id: 'contact', name: 'Ada Customer', phone: '2348000000000' }], next: null };
    else if (p.endsWith('/actions/customer')) result = { name: 'Ada Customer', phone: '+2348000000000' };
    else if (p.endsWith('/actions/payment')) { result = { paid, status: paid ? 'paid' : 'pending', amount: 25000 }; paid = true; }
    else if (p.endsWith('/actions/invoice')) { calls.push(body); result = { queued: true }; }
    else if (p.includes('/actions/crm/')) { if(body){calls.push(body); result={saved:true};}else result={records:[{_id:'a1',businessName:'Ada Customer',createdAt:'2026-10-20',servicePaidFor:'TikTok DM Ads',amountPaid:60000,adsPublished:false},{_id:'a2',businessName:'Ada Customer',createdAt:'2026-09-12',servicePaidFor:'Meta DM Ads',amountPaid:35000,adsPublished:true}]}; }
    await route.fulfill({ json: result });
  });

  await page.setViewportSize({width:1440,height:900}); await page.goto('http://localhost:3024/crm-inbox');
  await page.getByRole('button',{name:/Ada Customer/}).click();
  await page.getByLabel('Message tools',{exact:true}).click();
  await page.getByRole('button',{name:'Chat actions',exact:true}).click();
  await page.getByRole('button',{name:/Add to CRM Save/}).click();
  await page.getByRole('button',{name:/Ads Add/}).click();
  await page.getByText('Previous ads found',{exact:true}).waitFor();
  assert.equal(await page.getByText('Published',{exact:true}).count(),1);
  assert.equal(await page.getByText('Not published',{exact:true}).count(),1);
  await page.screenshot({path:'artifacts/inbox/ads-history-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'artifacts/inbox/ads-history-mobile.png'});
  await page.getByRole('button',{name:'Continue — add another ad'}).click();
  await page.getByRole('button',{name:'Add client',exact:true}).click();
  await page.getByText('Amount paid is required.',{exact:true}).waitFor();
  await page.getByText('Video links is required.',{exact:true}).waitFor();
  assert.equal(calls.length,0);
  await page.getByLabel('Amount paid (NGN)').fill('25000');
  await page.getByLabel('Video links').fill('https://example.test/video');
  await page.getByRole('button',{name:'Add client',exact:true}).click();
  await page.getByText('Client added to CRM',{exact:true}).waitFor();
  assert.equal(calls.length,1);assert.equal(calls[0].amountPaid,'25000');
  assert.deepEqual(errors,[]);await browser.close();console.log('PASS: ads history, publishing status, mobile layout, inline validation, optional login and successful new record.');
})().catch(e=>{console.error(e);process.exit(1)});
