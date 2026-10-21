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


 const base=process.env.INBOX_TEST_URL||'http://localhost:3023';
 await page.goto(base+'/crm-inbox');
 for (const width of [1440,1024,390]) {
  await page.setViewportSize({width,height:900});
  await page.getByRole('button',{name:'Filter conversations',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Filter conversations'});
  await dialog.waitFor();
  await dialog.locator('summary').click();
  const box=await dialog.boundingBox();
  assert.ok(box.x>=0&&box.x+box.width<=width);
  assert.ok(box.y>=0&&box.y+box.height<=900);
  if(width>900)assert.ok(Math.abs(box.x-(width-box.width)/2)<2,'dialog not centered');
  if(width>900)assert.equal(await dialog.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
  assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await page.screenshot({path:`artifacts/inbox/popup-filters-${width}.png`});
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
 }
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS: centered desktop dialogs, expanded filter controls, mobile bounds, no page errors.');
})().catch(e=>{console.error(e);process.exit(1)});
