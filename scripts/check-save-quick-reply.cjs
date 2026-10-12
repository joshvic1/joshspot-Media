const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true}); const page = await browser.newPage(); const errors=[];
 page.on('pageerror', e=>errors.push(e.message)); await page.addInitScript(()=>localStorage.setItem('adminToken','fixture-only'));
 const now=new Date().toISOString(); const mid=i=>String(i).padStart(24,'0');
 const note={_id:mid(1),type:'note',direction:'internal',text:'Please review this mention',createdAt:now,authorName:'Admin'};
 const reply=i=>({_id:mid(i),type:'text',direction:'inbound',text:`Later reply ${i}`,createdAt:now,...(i===53?{replyTo:{message:mid(1),text:'Original quote',authorName:'Customer'}}:{})});
 const chat={_id:'chat',contact:{name:'Mention Customer',phone:'2348000000000'},assignedTo:'staff',status:'open',labels:[],lastMessageAt:now,lastInboundAt:now,ai:{active:false}};
 let fresh=false; let forward=0;let saved;
 await page.route('**/api/**', async route=>{
  const u=new URL(route.request().url()),p=u.pathname.replace('/api/inbox','');let value={};
  if(p==='/session')value={actor:{id:'admin',role:'ADMIN',name:'Admin',admin:true},staff:[],provider:{configured:true}};
  else if(p==='/events-ticket')return route.fulfill({status:503,json:{}});
  else if(p==='/notifications')value={items:[{_id:'alert',authorName:'Admin',createdAt:now}],unread:1};
  else if(p==='/notifications/alert/read')value={conversation:'chat',message:note._id};
  else if(p==='/counts')value={inbox:1};
  else if(p==='/conversations')value={items:[chat],next:null};
  else if(p==='/conversations/chat')value=chat;
  else if(p.endsWith('/messages')){
   if(u.searchParams.has('target'))value={items:[note,...Array.from({length:50},(_,i)=>reply(i+2))],newer:'forward',changes:'delta',more:false};
   else if(u.searchParams.has('newer')){forward++;value={items:[reply(52),reply(53)],newer:null};}
   else if(u.searchParams.has('changes'))value={items:fresh?[reply(54)]:[],changes:'delta',more:false};
   else value={items:[reply(53)],changes:'delta',more:false};
  } else if(p.endsWith('/crm'))value=[];else if(p==='/quick-replies'){if(route.request().method()==='POST'){saved=route.request().postDataJSON();value={...saved,keyword:saved.keyword.toLowerCase()};}else value={items:saved?[saved]:[]};}
  await route.fulfill({json:value});
 });
 try{
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3005/crm-inbox');await page.getByText('Mention Customer',{exact:true}).click();
 await page.getByText('Later reply 53',{exact:true}).click({button:'right'});
 await page.getByRole('button',{name:'Save to Quick Replies',exact:true}).click();
 assert.equal(await page.getByLabel('Response',{exact:true}).inputValue(),'Later reply 53');
 await page.getByLabel('Keyword',{exact:true}).fill('setup');await page.getByLabel('Response',{exact:true}).fill('Hello\n\nHere are the details.');
 await page.getByRole('button',{name:'Save quick reply',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved as /setup'}).waitFor();
 assert.equal(saved.response,'Hello\n\nHere are the details.');assert.deepEqual(errors,[]);console.log('PASS: admin message-to-quick-reply form saves keyword and multiline response');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
