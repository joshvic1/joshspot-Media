const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true}); const page = await browser.newPage(); const errors=[];
 page.on('pageerror', e=>errors.push(e.message)); await page.addInitScript(()=>localStorage.setItem('crmToken','fixture-only'));
 const now=new Date().toISOString(); const mid=i=>String(i).padStart(24,'0');
 const note={_id:mid(1),type:'note',direction:'internal',text:'Please review this mention',createdAt:now,authorName:'Admin'};
 const reply=i=>({_id:mid(i),type:'text',direction:'inbound',text:`Later reply ${i}`,createdAt:now,...(i===53?{replyTo:{message:mid(1),text:'Original quote',authorName:'Customer'}}:{})});
 const chat={_id:'chat',contact:{name:'Mention Customer',phone:'2348000000000'},unread:true,unreadCount:2,lastInboundId:mid(53),assignedTo:'staff',status:'open',labels:[],lastMessageAt:now,lastInboundAt:now,ai:{active:false}};
 let fresh=false; let forward=0;let reads=[];
 await page.route('**/api/**', async route=>{
  const u=new URL(route.request().url()),p=u.pathname.replace('/api/inbox','');let value={};
  if(p==='/session')value={actor:{id:'staff',role:'CSS',name:'Support',admin:false},staff:[],provider:{configured:true}};
  else if(p==='/events-ticket')return route.fulfill({status:503,json:{}});
  else if(p==='/notifications')value={items:[{_id:'alert',authorName:'Admin',createdAt:now}],unread:1};
  else if(p==='/notifications/alert/read')value={conversation:'chat',message:note._id};
  else if(p==='/counts')value={inbox:1};
  else if(p==='/conversations')value={items:[chat],next:null};
  else if(p==='/conversations/chat')value=chat;
  else if(p==='/conversations/chat/read'){reads.push(route.request().postDataJSON().messageId);value={ok:true};}
  else if(p.endsWith('/messages')){
   if(u.searchParams.has('target'))value={items:[note,...Array.from({length:50},(_,i)=>reply(i+2))],newer:'forward',changes:'delta',more:false};
   else if(u.searchParams.has('newer')){forward++;value={items:[reply(52),reply(53)],newer:null};}
   else if(u.searchParams.has('changes'))value={items:fresh?[reply(54)]:[],changes:'delta',more:false};
   else value={items:[reply(52),reply(53)],firstUnread:mid(52),changes:'delta',more:false};
  } else if(p.endsWith('/crm'))value=[];else if(p==='/quick-replies')value={items:[]};
  await route.fulfill({json:value});
 });
 try{
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3005/crm-inbox');await page.getByRole('button',{name:'Filter conversations',exact:true}).click();await page.getByRole('radio',{name:'Unread',exact:true}).check();await page.getByRole('button',{name:'Apply filters',exact:true}).click();await page.getByText('Mention Customer',{exact:true}).click();
 await page.getByText('Later reply 52',{exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Message"]'));
 for(let i=0;i<30&&!reads.length;i++)await page.waitForTimeout(100);
 assert.deepEqual(reads,[mid(53)]);await page.getByRole('button',{name:'Back to latest messages',exact:true}).waitFor();await page.getByRole('button',{name:'Back to conversations',exact:true}).click();await page.getByRole('heading',{name:'A clear inbox'}).waitFor();assert.equal(await page.getByText('Mention Customer',{exact:true}).count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: first-unread opening preserves anchor and acknowledges existing unread messages');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
