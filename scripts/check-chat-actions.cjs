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
    else if (p.includes('/actions/crm/')) { calls.push(body); result = { saved: true }; }
    await route.fulfill({ json: result });
  });
  try {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto('http://localhost:3005/crm-inbox');
    const nav = page.getByRole('navigation', { name: 'Mobile Inbox navigation' });
    await nav.waitFor(); assert.equal(await nav.getByRole('button').count(), 3);
    await page.getByRole('button', { name: /Ada Customer/ }).click();
    assert.equal(await page.getByText('Correct sales details', { exact: true }).count(), 0);
    for (const width of [360,390,393,412,768,1440]) {
      await page.setViewportSize({width,height:844}); await page.waitForTimeout(250);
      const boxes = await Promise.all([page.getByLabel('Message tools',{exact:true}), page.getByLabel('Message',{exact:true}),page.getByRole('button',{name:'Write internal note'})].map(item=>item.boundingBox()));
      assert.ok(boxes.every(Boolean)); assert.ok(Math.abs((boxes[0].y+boxes[0].height/2)-(boxes[2].y+boxes[2].height/2))<3);
      assert.ok(boxes[0].x<boxes[1].x && boxes[1].x<boxes[2].x);
    }
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'artifacts/inbox/compact-composer.png'});
    await page.getByLabel('Conversation actions',{exact:true}).click();
    await page.getByRole('button',{name:'Sales details',exact:true}).click();
    await page.getByText('Correct sales details',{exact:true}).click();
    await page.getByLabel('Platform',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.getByLabel('Message tools',{exact:true}).click();
    await page.screenshot({path:'artifacts/inbox/compact-composer-tools.png'});
    await page.getByRole('button',{name:'Insert emoji',exact:true}).click();
    await page.getByRole('button',{name:'Smile',exact:true}).click();
    assert.equal(await page.getByLabel('Message',{exact:true}).inputValue(),'😊');
    await page.getByLabel('Message',{exact:true}).fill('First line');
    await page.getByLabel('Message',{exact:true}).press('End');
    await page.getByLabel('Message',{exact:true}).press('Enter');
    await page.getByLabel('Message',{exact:true}).pressSequentially('Second line');
    assert.equal(await page.getByLabel('Message',{exact:true}).inputValue(),'First line\nSecond line');
    await page.getByRole('button',{name:'Reply to message',exact:true}).click();
    await page.getByRole('button',{name:'Cancel reply'}).waitFor();
    await page.getByRole('button',{name:'Cancel reply'}).click();
    const bubble=page.getByText('Original customer message',{exact:true}).locator('..');
    await bubble.dispatchEvent('touchstart',{touches:[{identifier:1,clientX:40,clientY:200}]});
    await bubble.dispatchEvent('touchend',{changedTouches:[{identifier:1,clientX:130,clientY:201}]});
    await page.getByRole('button',{name:'Cancel reply'}).waitFor();
    await page.getByRole('button',{name:'Cancel reply'}).click();
    await page.getByLabel('Message', { exact: true }).fill('/wel');
    await page.getByRole('option', { name: /welcome/ }).click();
    assert.equal(await page.getByLabel('Message', { exact: true }).inputValue(), replies[0].response);
    await page.getByLabel('Message', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Write internal note' }).click();
    await page.getByRole('textbox', { name: 'Internal note', exact: true }).fill('Note first');
    await page.getByRole('textbox', { name: 'Internal note', exact: true }).press('End');
    await page.getByRole('textbox', { name: 'Internal note', exact: true }).press('Enter');
    await page.getByRole('textbox', { name: 'Internal note', exact: true }).pressSequentially('Note second');
    assert.ok((await page.getByRole('textbox', { name: 'Internal note', exact: true }).innerText()).includes('Note first\n'));
    await page.getByRole('textbox', { name: 'Internal note', exact: true }).fill('/wel');
    await page.getByRole('option', { name: /welcome/ }).click();
    assert.ok((await page.getByRole('textbox', { name: 'Internal note', exact: true }).innerText()).includes(replies[0].response));
    await page.getByLabel('Message tools', { exact: true }).click();
    await page.getByRole('button', { name: 'Chat actions', exact: true }).click();
    await page.getByRole('button', { name: /Generate Invoice Create/ }).waitFor();
    await page.screenshot({ path: 'artifacts/inbox/chat-actions-mobile.png' });
    for (const [width, height] of [[360,800],[390,844],[393,873],[412,915],[768,900],[1440,900]]) {
      await page.setViewportSize({ width, height }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: /Generate Invoice Create/ }).click();
    await page.getByLabel('Invoice amount (NGN)').fill('25000');
    await page.getByRole('button', { name: 'Generate Invoice and Send' }).click();
    await page.getByText('Invoice queued for sending', { exact: true }).waitFor(); assert.equal(calls[0].amount, '25000');
    await page.getByRole('button', { name: 'Back to chat' }).click();
    await page.getByLabel('Message tools', { exact: true }).click();
    await page.getByRole('button', { name: 'Chat actions', exact: true }).click();
    await page.getByRole('button', { name: /Confirm Payment Check/ }).click(); await page.getByText('Payment not received yet', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Check again' }).click(); await page.getByText('Payment Received', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: /Add to CRM Save/ }).click();
    await page.getByRole('button', { name: /Setup Add/ }).click();
    await page.getByLabel('Service paid for').selectOption('Meta ads setup');
    assert.equal(await page.locator('input[value="+2348000000000"]').count(), 0);
    await page.screenshot({ path: 'artifacts/inbox/chat-actions-setup.png' });
    await page.getByRole('button', { name: 'Add client', exact: true }).click(); await page.getByText('Client added to CRM', { exact: true }).waitFor();
    assert.equal(calls[1].clientNumber, undefined); assert.equal(calls[1].businessName, undefined);
    await page.goto('http://localhost:3005/admin-7812er/quick-replies');
    await page.getByRole('button', { name: 'Add quick reply' }).click(); await page.getByLabel('Keyword', { exact: true }).fill('thanks'); await page.getByLabel('Response', { exact: true }).fill('Thank you!'); await page.getByRole('button', { name: 'Save quick reply' }).click(); await page.getByText('/thanks', { exact: true }).waitFor();
    await page.goto('http://localhost:3005/admin-7812er/inbox-contacts'); await page.getByText('Ada Customer', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []); console.log('PASS: slash replies/notes, invoice send, silent payment check, locked CRM identity, admin libraries and six viewport sizes');
  } catch (e) { console.error(await page.locator('body').innerText()); throw e; } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
