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
 let messages=['text','note','image'].map((type,i)=>({_id:String(i), direction:'inbound', type, text:`[${type} message]`,providerId:'wamid.'+i,status:'received',media:i===2?{id:'media'+i}:undefined, createdAt:now}));
 let video;
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='localhost')return route.fulfill({status:200,body:''});if(u.pathname==='/fixture-audio')return route.fulfill({body:audio,contentType:'audio/wav'});if(u.pathname==='/fixture-video')return route.fulfill({body:video,contentType:'video/webm'});if(u.pathname==='/fixture-image')return route.fulfill({body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64'),contentType:'image/png'});if(!u.pathname.startsWith('/api/inbox'))return route.continue();let body;const p=u.pathname.slice('/api/inbox'.length);if(p==='/events-ticket')return route.fulfill({status:503,json:{message:'Fixture uses fallback'}});else if(p==='/quick-replies')body={items:[]};else if(p==='/notifications')body={items:[],unread:0,next:null};else if(p==='/session')body=session;else if(p.endsWith('/reaction')){const n=Number(p.split('/')[4]);messages[n].reactions={[messages[n].type==='note'?'staff_admin':'business']:{emoji:route.request().postDataJSON().emoji,name:'Administrator',status:'sent'}};body={ok:true};}else if(p.endsWith('/media-info'))body={state:'ready',keep:kept};else if(p.endsWith('/media-keep')){kept=route.request().postDataJSON().keep;body={state:'ready',keep:kept};}else if(p.endsWith('/media')){const n=Number(p.split('/')[4]);return route.fulfill({body:n===0?audio:n===1?video:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64'),contentType:n===0?'audio/wav':n===1?'video/webm':'image/png'});}else if(p.endsWith('/media-link')){const n=Number(p.split('/')[4]);body={source:'meta'};}else if(p==='/counts')body={inbox:7,unread:1};else if(p==='/conversations')body={items:rows,next:null};else if(p.endsWith('/crm'))body=[];else if(p.endsWith('/read'))body={ok:true};else if(p.endsWith('/messages')){if(route.request().method()==='POST'){const d=route.request().postDataJSON();messages.push({_id:'007',direction:d.type==='note'?'internal':'outbound',type:d.type,text:d.text,createdAt:now,status:'internal',authorName:'Administrator'});body={ok:true};}else body={items:u.searchParams.has('kind')?[]:[...messages],more:false,changes:'fixture',next:null};}else if(p.startsWith('/conversations/'))body=rows.find(r=>p.endsWith(r._id))||rows[0];else if(p==='/templates')body={items:[{_id:'welcome',name:'course_follow_up',language:'en',category:'UTILITY',status:'APPROVED',components:[{type:'BODY',text:'Hello {{1}}, here are the course details you requested.'}],fields:[{key:'body.1',component:'body',position:1}]}],next:null};else throw Error('Unexpected fixture request '+p);return route.fulfill({json:body});});

 await page.setViewportSize({width:390,height:844}); await page.goto('http://localhost:3005/crm-inbox');
 await page.getByRole('button',{name:/Ada Okafor/}).waitFor().catch(async error=>{console.log(await page.locator('body').innerText(),errors);throw error;});await page.waitForTimeout(500);
 await page.getByRole('button',{name:/Ada Okafor/}).click();
 for(const width of [360,390,1440]) {
  await page.setViewportSize({width,height:900});
  const trigger=page.getByRole('button',{name:'React to message'}).first();
  await trigger.click();const picker=page.getByRole('group',{name:'WhatsApp reactions'});await picker.waitFor();
  const box=await picker.boundingBox();assert(box.x>=0 && box.x+box.width<=width);
  await page.getByRole('button',{name:'Love',exact:true}).click();
  await page.getByRole('button',{name:'❤️ reaction by Administrator'}).waitFor();
  await page.getByRole('button',{name:'❤️ reaction by Administrator'}).click();
  await page.getByRole('button',{name:'❤️ reaction by Administrator'}).waitFor({state:'detached'});
 }
 await page.getByRole('button',{name:'React to message'}).nth(1).click();
 await page.getByRole('button',{name:'Check',exact:true}).click();await page.getByRole('button',{name:'✅ reaction by Administrator'}).waitFor();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Media options'}).click();await page.getByRole('button',{name:'Keep media',exact:true}).click();await page.getByText('Media saved',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'artifacts/inbox/reactions-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: reactions add/remove, notes, media label, desktop/mobile picker bounds');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
