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
    else if (p.includes('/actions/crm/')) { calls.push(body); result = { saved: true }; }
    await route.fulfill({ json: result });
  });
  try {
    await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3005/crm-inbox');
    await page.getByRole('button',{name:/Ada Customer/}).click();
    const incoming=page.locator('article').filter({hasText:'Original customer message'});
    const outgoing=page.locator('article').filter({hasText:'Our reply'});
    await incoming.waitFor();assert.equal(await page.getByRole('button',{name:'Reply to message',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'React to message',exact:true}).count(),0);
    for(const [bubble,start,end] of [[incoming,40,120],[outgoing,180,100]]) {
      await bubble.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',button:0,clientX:start,clientY:200});
      await bubble.dispatchEvent('pointermove',{pointerId:1,pointerType:'touch',clientX:end,clientY:202});
      assert.notEqual(await bubble.evaluate(el=>el.style.transform),'translateX(0px)');
      await bubble.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch',clientX:end,clientY:202});
      await page.getByRole('button',{name:'Cancel reply'}).click();
    }
    await incoming.dispatchEvent('pointerdown',{pointerId:2,pointerType:'touch',button:0,clientX:50,clientY:200});
    await page.getByRole('dialog',{name:'Message actions'}).waitFor();
    await incoming.dispatchEvent('pointerup',{pointerId:2,pointerType:'touch',clientX:50,clientY:200});
    await page.getByRole('button',{name:'Reply',exact:true}).click();await page.getByRole('button',{name:'Cancel reply'}).click();
    await outgoing.click({button:'right'});await page.getByRole('dialog',{name:'Message actions'}).getByText('Administrator',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Keep media',exact:true}).click();
    await page.getByRole('button',{name:'Keep requested',exact:true}).waitFor(); assert.equal(calls.at(-1).keep,true);
    await page.screenshot({path:'artifacts/inbox/long-press-message.png'});
    await page.getByRole('button',{name:'Thumbs up',exact:true}).click();
    await page.getByRole('dialog',{name:'Message actions'}).waitFor({state:'hidden'});
    for(const width of [360,390,393,412,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    assert.deepEqual(errors,[]);console.log('PASS: long press, sender details, reactions, directional visual swipes, compact bubbles');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
