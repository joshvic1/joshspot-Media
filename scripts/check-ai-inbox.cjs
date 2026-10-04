const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const page = await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const now=new Date().toISOString(); const actions=[];
 const conversation={_id:'conversation1',contact:{_id:'contact1',name:'AI Test Customer',phone:'2348000000000',status:'lead'},assignedTo:null,status:'open',labels:[],lastMessageAt:now,lastInboundAt:now,createdAt:now,preview:'How much is setup?',ai:{active:true,version:0,state:{},draft:{inputId:'input1',mode:'DRAFT',action:'reply',response:'TikTok setup costs ₦20,000.'}}};
 await page.addInitScript(()=>localStorage.setItem('adminToken','fixture-only'));
 await page.route('**/api/inbox/**',async route=>{
  const url=new URL(route.request().url()); const p=url.pathname.replace('/api/inbox','');let result={ok:true};
  if(p==='/session')result={actor:{id:'admin',name:'Administrator',role:'ADMIN',admin:true},staff:[],provider:{configured:true,missing:[]}};
  else if(p==='/events-ticket')return route.fulfill({status:503,json:{message:'Fixture polling'}});
  else if(p==='/notifications')result={items:[],unread:0};
  else if(p==='/counts')result={inbox:1,unread:0};
  else if(p==='/conversations')result={items:[conversation],next:null};
  else if(p==='/conversations/conversation1')result=conversation;
  else if(p.endsWith('/messages'))result={items:[{_id:'input1',type:'text',direction:'inbound',text:'How much is setup?',createdAt:now}],more:false,next:null};
  else if(p.endsWith('/crm'))result=[];
  else if(p.endsWith('/control')){const body=route.request().postDataJSON();actions.push(body);conversation.ai.active=body.action==='return';conversation.ai.draft=null;}
  else if(p.endsWith('/draft')){actions.push(route.request().postDataJSON());conversation.ai.draft=null;}
  return route.fulfill({json:result});
 });
 try{
  await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3005/crm-inbox');
  await page.getByRole('button',{name:/AI Test Customer/}).click();
  await page.getByText('AI suggested reply',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Edit & send',exact:true}).click();
  await page.getByLabel('Edit AI suggestion').fill('Approved staff reply.');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await page.getByText('AI suggested reply',{exact:true}).waitFor({state:'hidden'});
  assert.equal(actions[0].text,'Approved staff reply.');
  await page.getByRole('button',{name:'Take over',exact:true}).click();
  await page.getByRole('button',{name:'Return to AI',exact:true}).click();
  await page.getByRole('button',{name:'Take over',exact:true}).waitFor();
  assert.deepEqual(actions.map(a=>a.action),['send','takeover','return']);
  for(const width of [360,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  assert.deepEqual(errors,[]);console.log('PASS: draft edit/send, takeover, return, responsive Inbox');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
