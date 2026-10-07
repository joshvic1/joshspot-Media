const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});let prefs={assignments:false,messages:false,mentions:false,followups:false};let removed=false;let admin=true;
 await page.addInitScript(()=>{
  window.permissionPrompts=0;const mock={permission:'default',requestPermission:async()=>{window.permissionPrompts++;mock.permission='granted';return 'granted'}};
  Object.defineProperty(window,'Notification',{value:mock,configurable:true});Object.defineProperty(window,'PushManager',{value:function(){},configurable:true});
  let sub=null;const registration={pushManager:{getSubscription:async()=>sub,subscribe:async()=>{sub={endpoint:'https://fcm.googleapis.com/test',toJSON(){return {endpoint:this.endpoint,keys:{p256dh:'a'.repeat(87),auth:'b'.repeat(22)}}},unsubscribe:async()=>{sub=null;return true}};return sub}}};
  Object.defineProperty(navigator,'serviceWorker',{value:{getRegistration:async()=>registration,register:async()=>registration,ready:Promise.resolve(registration)},configurable:true});
 });
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='localhost')return route.fulfill({body:''});if(!u.pathname.startsWith('/api/'))return route.continue();
  const p=u.pathname.replace('/api/inbox','');let body={items:[],next:null};
  if(p==='/session')body={actor:{id:admin?'admin':'staff',admin,role:admin?'ADMIN':'CSS',name:'User'},staff:[],provider:{configured:true,missing:[],failedJobs:0}};
  else if(p==='/events-ticket')return route.fulfill({status:503,json:{message:'Mock'}});
  else if(p==='/counts')body={inbox:0,unread:0};
  else if(p==='/notifications')body={items:[],unread:0};
  else if(p==='/push/config')body={configured:true,publicKey:'YQ'};
  else if(p==='/push/preferences')body={preferences:prefs};
  else if(p==='/push/subscription'){if(route.request().method()==='DELETE')removed=true;else prefs=route.request().postDataJSON().preferences;body={preferences:prefs,ok:true};}
  return route.fulfill({json:body});
 });
 await page.goto('http://localhost:3005/crm-inbox');
 await page.getByRole('button',{name:'Settings',exact:true}).filter({visible:true}).click();
 await page.getByRole('button',{name:'Enable device notifications'}).waitFor();
 assert.equal(await page.evaluate(()=>window.permissionPrompts),0);
 const switches=page.getByRole('switch');assert.equal(await switches.count(),5);
 for(const toggle of await switches.all()){assert.equal(await toggle.isChecked(),(await toggle.getAttribute('aria-label'))==='Show names and message previews');assert.equal(await toggle.isDisabled(),false)}
 await page.getByRole('button',{name:'Enable device notifications'}).click();
 await page.getByRole('button',{name:'Turn off device notifications'}).waitFor();
 assert.equal(await page.evaluate(()=>window.permissionPrompts),1);
 for(const toggle of await switches.all())assert.equal(await toggle.isChecked(),(await toggle.getAttribute('aria-label'))==='Show names and message previews');
 await page.getByRole('switch',{name:'New messages',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="New messages"]').checked);
 assert.equal(prefs.messages,true);assert.equal(prefs.assignments,false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'artifacts/inbox/notification-settings.png'});
 await page.getByRole('button',{name:'Turn off device notifications'}).click();
 await page.getByRole('button',{name:'Enable device notifications'}).waitFor();assert.equal(removed,true);
 await page.getByRole('switch',{name:'Staff mentions',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Staff mentions"]').checked);assert.equal(prefs.mentions,true);
 assert.equal(await page.getByRole('heading',{name:'WhatsApp Business'}).count(),1);admin=false;await page.reload();await page.getByRole('button',{name:'Settings',exact:true}).filter({visible:true}).click();await page.getByRole('heading',{name:'Notifications',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'WhatsApp Business'}).count(),0);
 console.log('PASS: mobile Settings, opt-in permission, defaults off, independent preferences, unsubscribe');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
