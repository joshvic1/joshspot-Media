const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
// Browser-only fixtures. No records are created and no WhatsApp messages are sent.
(async () => {
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
 const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 let reads=0;let conversationLoads=0;const now=new Date().toISOString();
 const session={actor:{id:'helper',name:'Helper',role:'CSS',admin:false},staff:[{_id:'agent1',name:'Trisha',role:'CSS'}],provider:{configured:true,missing:[],failedJobs:0}};
 const names=['Ada Okafor','Daniel Bello','Grace Adebayo','Samuel Eze','Esther Musa','David James','Ruth Williams'];
 const rows=names.map((name,i)=>({_id:i===0?'111111111111111111111111':`conversation${i}`,contact:{_id:`contact${i}`,name,phone:'2348000000000',email:'preview@example.test',status:'lead',source:'Course page',service:'WhatsApp course',revision:0},assignedTo:'agent1',noteOnly:true,ai:{active:false},status:'open',labels:i?[]:['Interested'],lastMessageAt:now,lastInboundAt:now,lastInboundId:'006',createdAt:now,revision:0,unread:i===1,preview:['Thank you, that helps a lot!','Can I join the next training?','I have a question about the course.','Thanks for the information.','Is the class self-paced?','I have completed my payment.','Please send the course details.'][i]}));
 let messages=[{_id:'001',direction:'inbound',type:'text',text:'Hi! I would like to learn more about the WhatsApp course.',createdAt:now,status:'received'},{_id:'002',direction:'outbound',type:'text',text:'Hello Ada! Happy to help. What would you like to know?',createdAt:now,status:'read',authorName:'Trisha'},{_id:'003',direction:'inbound',type:'text',text:'Can I take the lessons at my own pace? I work during the day.',createdAt:now,status:'received'},{_id:'004',direction:'outbound',type:'text',text:'Yes, you can work through the lessons when it suits you. You will also have access to the training community.',createdAt:now,status:'delivered',authorName:'Trisha'},{_id:'005',direction:'internal',type:'note',text:'Interested in the next class. Follow up tomorrow.',createdAt:now,status:'internal',authorName:'Trisha'},{_id:'006',direction:'inbound',type:'text',text:'Thank you, that helps a lot!',createdAt:now,status:'received'}];
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='localhost')return route.fulfill({status:200,body:''});if(!u.pathname.startsWith('/api/inbox'))return route.continue();let body;const p=u.pathname.slice('/api/inbox'.length);if(route.request().method()==='POST'&&p.endsWith('/messages'))assert.equal(route.request().postDataJSON().type,'note');if(p==='/events-ticket')return route.fulfill({status:503,json:{message:'Fixture uses fallback'}});else if(p==='/notifications')body={items:[],unread:0,next:null};else if(p==='/session')body=session;else if(p==='/counts')body={inbox:7,unread:1};else if(p==='/conversations')body={items:rows,next:null};else if(p.endsWith('/crm'))body=[];else if(p.endsWith('/read')){reads++;body={ok:true};}else if(p.endsWith('/messages')){if(route.request().method()==='POST'){const d=route.request().postDataJSON();messages.push({_id:'007',direction:d.type==='note'?'internal':'outbound',type:d.type,text:d.text,createdAt:now,status:'internal',authorName:'Administrator'});body={ok:true};}else body={items:u.searchParams.has('kind')?[]:[...messages],more:false,changes:'fixture',next:null};}else if(p.startsWith('/conversations/')){conversationLoads++;body=rows.find(r=>p.endsWith(r._id))||rows[0];}else if(p==='/templates')body={items:[{_id:'welcome',name:'course_follow_up',language:'en',category:'UTILITY',status:'APPROVED',components:[{type:'BODY',text:'Hello {{1}}, here are the course details you requested.'}],fields:[{key:'body.1',component:'body',position:1}]}],next:null};else body={items:[],enabled:false,subscription:null,preferences:{},days:[],months:[]};return route.fulfill({json:body});});


 await page.setViewportSize({width:390,height:844});
 await page.goto('http://localhost:3017/crm-inbox?conversation=111111111111111111111111');
 await page.getByText('You were tagged to help. Only internal notes are available.').waitFor();
 assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).count(),0);
 const editor=page.locator('[contenteditable="true"]');await editor.fill('Please check their setup details.');
 await page.getByRole('button',{name:'Send internal note',exact:true}).click();
 await page.waitForTimeout(500);assert.ok(messages.some(m=>m.text==='Please check their setup details.'&&m.type==='note'));
 await page.getByLabel('Conversation actions',{exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Transfer Chat',exact:true}).isDisabled(),true);
 await page.screenshot({path:'artifacts/inbox/mention-notes-only.png'});
 assert.deepEqual(errors,[]);console.log('PASS: tagged colleague gets internal-note editor only, sends note and cannot transfer.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
