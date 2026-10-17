const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
// Browser-only fixtures. No records are created and no WhatsApp messages are sent.
(async () => {
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
 const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 let reads=0;let conversationLoads=0;const now=new Date().toISOString();
 const session={actor:{id:'admin',name:'Administrator',role:'ADMIN',admin:true},staff:[{_id:'agent1',name:'Trisha',role:'CSS'}],provider:{configured:true,missing:[],failedJobs:0}};
 const names=['Ada Okafor','Daniel Bello','Grace Adebayo','Samuel Eze','Esther Musa','David James','Ruth Williams'];
 const rows=names.map((name,i)=>({_id:`conversation${i}`,contact:{_id:`contact${i}`,name,phone:'2348000000000',email:'preview@example.test',status:'lead',source:'Course page',service:'WhatsApp course',revision:0},assignedTo:'agent1',status:'open',labels:i?[]:['Interested'],lastMessageAt:now,lastInboundAt:now,lastInboundId:'006',createdAt:now,revision:0,unread:i===1,preview:['Thank you, that helps a lot!','Can I join the next training?','I have a question about the course.','Thanks for the information.','Is the class self-paced?','I have completed my payment.','Please send the course details.'][i]}));
 let messages=[{_id:'001',direction:'inbound',type:'text',text:'Hi! I would like to learn more about the WhatsApp course.',createdAt:now,status:'received'},{_id:'002',direction:'outbound',type:'text',text:'Hello Ada! Happy to help. What would you like to know?',createdAt:now,status:'read',authorName:'Trisha'},{_id:'003',direction:'inbound',type:'text',text:'Can I take the lessons at my own pace? I work during the day.',createdAt:now,status:'received'},{_id:'004',direction:'outbound',type:'text',text:'Yes, you can work through the lessons when it suits you. You will also have access to the training community.',createdAt:now,status:'delivered',authorName:'Trisha'},{_id:'005',direction:'internal',type:'note',text:'Interested in the next class. Follow up tomorrow.',createdAt:now,status:'internal',authorName:'Trisha'},{_id:'006',direction:'inbound',type:'text',text:'Thank you, that helps a lot!',createdAt:now,status:'received'}];
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='localhost')return route.fulfill({status:200,body:''});if(!u.pathname.startsWith('/api/inbox'))return route.continue();let body;const p=u.pathname.slice('/api/inbox'.length);if(p==='/events-ticket')return route.fulfill({status:503,json:{message:'Fixture uses fallback'}});else if(p==='/notifications')body={items:[],unread:0,next:null};else if(p==='/session')body=session;else if(p==='/counts')body={inbox:7,unread:1};else if(p==='/conversations')body={items:rows,next:null};else if(p.endsWith('/crm'))body=[];else if(p.endsWith('/read')){reads++;body={ok:true};}else if(p.endsWith('/messages')){if(route.request().method()==='POST'){const d=route.request().postDataJSON();messages.push({_id:'007',direction:d.type==='note'?'internal':'outbound',type:d.type,text:d.text,createdAt:now,status:'internal',authorName:'Administrator'});body={ok:true};}else body={items:u.searchParams.has('kind')?[]:[...messages],more:false,changes:'fixture',next:null};}else if(p.startsWith('/conversations/')){conversationLoads++;body=rows.find(r=>p.endsWith(r._id))||rows[0];}else if(p==='/templates')body={items:[{_id:'welcome',name:'course_follow_up',language:'en',category:'UTILITY',status:'APPROVED',components:[{type:'BODY',text:'Hello {{1}}, here are the course details you requested.'}],fields:[{key:'body.1',component:'body',position:1}]}],next:null};else body={items:[],enabled:false,subscription:null,preferences:{},days:[],months:[]};return route.fulfill({json:body});});

 const base=process.env.INBOX_TEST_URL||'http://localhost:3015';const out=path.resolve('artifacts/inbox');fs.mkdirSync(out,{recursive:true});
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/crm-inbox');
 await page.getByRole('heading',{name:'Your inbox, at your pace'}).waitFor();await page.getByRole('button',{name:/Ada Okafor/}).waitFor();
 await page.waitForTimeout(500);assert.equal(conversationLoads,0);assert.equal(reads,0);
 await page.setViewportSize({width:1000,height:800});await page.setViewportSize({width:1440,height:900});assert.equal(conversationLoads,0);
 await page.screenshot({path:path.join(out,'desktop-inbox-empty.png')});
 await page.getByRole('button',{name:/Ada Okafor/}).click();await page.getByRole('textbox',{name:'Message',exact:true}).waitFor();
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Unsent draft for panel test');
 for(const [label,selector] of [['Conversations','section[aria-label="Conversations"]'],['Conversation','section[aria-label^="Conversation with"]'],['Customer details','aside[aria-label="Customer details"]']]){
  await page.getByRole('button',{name:'Hide '+label+' column',exact:true}).click();assert.equal(await page.locator(selector).isVisible(),false);
  await page.getByRole('button',{name:'Show '+label+' column',exact:true}).click();assert.equal(await page.locator(selector).isVisible(),true);
  await page.getByRole('button',{name:'Expand '+label+' column',exact:true}).click();assert.equal(await page.locator(selector).isVisible(),true);
  await page.getByRole('button',{name:'Restore all columns'}).click();
 }
 assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).inputValue(),'Unsent draft for panel test');
 await page.getByRole('textbox',{name:'Search conversations'}).click();
 const readBefore=reads;await page.getByRole('button',{name:'Hide Conversation column',exact:true}).click();
 rows[0].lastInboundId='008';messages.push({_id:'008',direction:'inbound',type:'text',text:'New message while collapsed',status:'received',createdAt:now});
 await page.evaluate(()=>window.dispatchEvent(new Event('inbox-update')));await page.waitForTimeout(2600);assert.equal(reads,readBefore,'hidden chat marked new message read');
 await page.getByRole('button',{name:'Show Conversation column',exact:true}).click();
 await page.evaluate(()=>window.dispatchEvent(new Event('inbox-update')));await page.waitForTimeout(2600);assert.ok(reads>readBefore,'visible chat did not resume read updates');

 for(const width of [1920,1440,1280,1024,901]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow at '+width);
  const rects=await page.evaluate(()=>Array.from(document.querySelectorAll('section[aria-label="Conversations"],section[aria-label^="Conversation with"],aside[aria-label="Customer details"]')).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,width:r.width};}));
  assert.equal(rects.length,3);assert.ok(rects.every(r=>r.width>180&&r.right<=width),JSON.stringify({width,rects}));assert.ok(Math.max(...rects.map(r=>r.y))-Math.min(...rects.map(r=>r.y))<2);
  if(width===1440||width===1024)await page.screenshot({path:path.join(out,'desktop-inbox-'+width+'.png')});
 }
 await page.setViewportSize({width:390,height:844});assert.equal(await page.getByRole('banner',{name:'Desktop inbox layout'}).isVisible(),false);
 await page.getByRole('button',{name:'Back to conversations'}).click();assert.equal(await page.locator('section[aria-label="Conversations"]').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: no automatic selection or reads; resize retains empty state; three hide/show/focus controls; draft retained; aligned panels at 1920/1440/1280/1024/901; mobile unaffected.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
