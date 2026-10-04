const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
// Browser-only fixtures. No records are created and no WhatsApp messages are sent.
(async () => {
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
 const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const now=new Date().toISOString(); let kept=false;
 const audio=Buffer.alloc(44+16000); audio.write('RIFF'); audio.writeUInt32LE(audio.length-8,4); audio.write('WAVEfmt ',8); audio.writeUInt32LE(16,16); audio.writeUInt16LE(1,20); audio.writeUInt16LE(1,22); audio.writeUInt32LE(8000,24); audio.writeUInt32LE(16000,28); audio.writeUInt16LE(2,32); audio.writeUInt16LE(16,34); audio.write('data',36); audio.writeUInt32LE(16000,40);

 const session={actor:{id:'admin',name:'Administrator',role:'ADMIN',admin:true},staff:[{_id:'agent1',name:'Trisha',role:'CSS'}],provider:{configured:true,missing:[],failedJobs:0}};
 const names=['Ada Okafor','Daniel Bello','Grace Adebayo','Samuel Eze','Esther Musa','David James','Ruth Williams'];
 const rows=names.map((name,i)=>({_id:`conversation${i}`,contact:{_id:`contact${i}`,name,phone:'2348000000000',email:'preview@example.test',status:'lead',source:'Course page',service:'WhatsApp course',revision:0},assignedTo:'agent1',status:'open',labels:i?[]:['Interested'],lastMessageAt:now,lastInboundAt:now,createdAt:now,revision:0,unread:i===1,preview:['Thank you, that helps a lot!','Can I join the next training?','I have a question about the course.','Thanks for the information.','Is the class self-paced?','I have completed my payment.','Please send the course details.'][i]}));
 let messages=['text','note','image'].map((type,i)=>({_id:String(i), direction:i===0?'outbound':'inbound', type, text:`[${type} message]`,providerId:'wamid.'+i,status:'read',media:i===2?{id:'media'+i}:undefined, createdAt:now}));
 let video;
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='localhost')return route.fulfill({status:200,body:''});if(u.pathname==='/fixture-audio')return route.fulfill({body:audio,contentType:'audio/wav'});if(u.pathname==='/fixture-video')return route.fulfill({body:video,contentType:'video/webm'});if(u.pathname==='/fixture-image')return route.fulfill({body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64'),contentType:'image/png'});if(!u.pathname.startsWith('/api/inbox'))return route.continue();let body;const p=u.pathname.slice('/api/inbox'.length);if(p==='/events-ticket')return route.fulfill({status:503,json:{message:'Fixture uses fallback'}});else if(p==='/notifications')body={items:[],unread:0,next:null};else if(p==='/session'){await new Promise(r=>setTimeout(r,700));body=session;}else if(p.endsWith('/reaction')){const n=Number(p.split('/')[4]);messages[n].reactions={[messages[n].type==='note'?'staff_admin':'business']:{emoji:route.request().postDataJSON().emoji,name:'Administrator',status:'sent'}};body={ok:true};}else if(p.endsWith('/media-info'))body={state:'ready',keep:kept};else if(p.endsWith('/media-keep')){kept=route.request().postDataJSON().keep;body={state:'ready',keep:kept};}else if(p.endsWith('/media')){const n=Number(p.split('/')[4]);return route.fulfill({body:n===0?audio:n===1?video:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64'),contentType:n===0?'audio/wav':n===1?'video/webm':'image/png'});}else if(p.endsWith('/media-link')){const n=Number(p.split('/')[4]);body={source:'meta'};}else if(p==='/counts')body={inbox:7,unread:1};else if(p==='/conversations')body={items:rows,next:null};else if(p.endsWith('/crm'))body=[];else if(p.endsWith('/read'))body={ok:true};else if(p.endsWith('/messages')){await new Promise(r=>setTimeout(r,350));if(route.request().method()==='POST'){const d=route.request().postDataJSON();messages.push({_id:'007',direction:d.type==='note'?'internal':'outbound',type:d.type,text:d.text,createdAt:now,status:'internal',authorName:'Administrator'});body={ok:true};}else body={items:u.searchParams.has('kind')?[]:[...messages],more:false,changes:'fixture',next:null};}else if(p.startsWith('/conversations/'))body=rows.find(r=>p.endsWith(r._id))||rows[0];else if(p==='/templates')body={items:[{_id:'welcome',name:'course_follow_up',language:'en',category:'UTILITY',status:'APPROVED',components:[{type:'BODY',text:'Hello {{1}}, here are the course details you requested.'}],fields:[{key:'body.1',component:'body',position:1}]}],next:null};else throw Error('Unexpected fixture request '+p);return route.fulfill({json:body});});

 await page.setViewportSize({width:390,height:844}); await page.goto('http://localhost:3005/crm-inbox');
 await page.getByRole('button',{name:'All',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Open CRM navigation'}).filter({visible:true}).count(),1);
 await page.getByRole('button',{name:'Open CRM navigation'}).filter({visible:true}).click();
 await page.getByRole('dialog',{name:'CRM menu'}).waitFor();await page.getByRole('button',{name:'Close CRM menu'}).click();
 await page.getByRole('button',{name:'Mine',exact:true}).click();await page.getByRole('button',{name:'All',exact:true}).click();
 await page.getByRole('button',{name:'Filter conversations',exact:true}).click();
 await page.getByRole('radio',{name:'Resolved',exact:true}).check();await page.getByRole('button',{name:'Apply filters'}).click();
 await page.getByRole('button',{name:'Resolved',exact:true}).waitFor();await page.getByRole('button',{name:'Resolved',exact:true}).click();
 await page.getByRole('button',{name:/Ada Okafor/}).click();
 await page.getByRole('status',{name:'Loading conversation',exact:true}).waitFor();
 await page.getByRole('img',{name:'read',exact:true}).waitFor();
 assert.equal(await page.getByRole('img',{name:'read',exact:true}).locator('svg').count(),2);
 await page.getByRole('button',{name:'View full image'}).click();
 await page.getByRole('dialog',{name:'Media preview'}).waitFor();await page.waitForTimeout(300);await page.screenshot({path:'artifacts/inbox/polish-media.png'});assert.equal(page.context().pages().length,1);
 await page.getByRole('button',{name:'Close media preview'}).click();
 await page.getByRole('button',{name:'Write internal note',exact:true}).click();
 const editor=page.getByRole('textbox',{name:'Internal note',exact:true});
 for (const mode of ['beforeinput','keyboard']) {
  await editor.pressSequentially('@Tri');await page.getByRole('option',{name:/Trisha/}).click();
  assert.equal(await editor.locator('strong').count(),1);
  await editor.pressSequentially('hello');
  for(let i=0;i<6;i++) await editor.press('Backspace');
  if(mode==='beforeinput') await editor.evaluate(el=>{
   const token=el.querySelector('strong');const range=document.createRange();range.setStartAfter(token);range.collapse(true);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
   el.dispatchEvent(new InputEvent('beforeinput',{inputType:'deleteContentBackward',bubbles:true,cancelable:true}));
  }); else await editor.press('Backspace');
  assert.equal(await editor.locator('strong').count(),0);
  await editor.press('ControlOrMeta+A');await editor.press('Backspace');
 }
 for(const width of [360,390,768,1440]) {
  await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);await page.screenshot({path:'artifacts/inbox/polish-chat.png'});
 await page.getByRole('button',{name:'Back to conversations'}).click();await page.screenshot({path:'artifacts/inbox/polish-list.png'});
 assert.deepEqual(errors,[]);console.log('PASS: mobile deletion, CRM menu, filters, skeleton, media modal, icon receipts, responsive overflow');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
