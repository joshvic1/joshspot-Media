const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');const defaults=require('../../backend/inbox/ai/defaults');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('adminToken','fixture-only'));
 let config={revision:-1,data:structuredClone(defaults.config),staff:[],providerReady:false};let records=[];let saved=0;
 await page.route('**/api/inbox/**',async route=>{
  const url=new URL(route.request().url());const path=url.pathname.replace('/api/inbox','');const body=route.request().postDataJSON();let value;
  if(path==='/ai/config'){if(body){config.data=body.data;config.revision++;saved++;}value=config;}
  else if(path==='/ai/initialize'){config.revision=0;records=[...defaults.records,...require('../../backend/inbox/ai/structuredKnowledge').seeds].map((r,i)=>({...structuredClone(r),_id:String(i+1).padStart(24,'0'),enabled:true,revision:0,updatedAt:new Date().toISOString()}));value=config;}
  else if(path==='/ai/records' && !body)value={items:records.filter(r=>r.kind===url.searchParams.get('kind')),next:null};
  else if(path.startsWith('/ai/records')){const id=path.split('/').at(-1);const index=records.findIndex(r=>r._id===id);value={...body,_id:index<0?'000000000000000000000099':id,updatedAt:new Date().toISOString()};if(index<0)records.push(value);else records[index]=value;saved++;}
  else if(path==='/ai/test')value={action:'reply',intent:'advertising',response:'TikTok Ads Account Setup costs ₦20,000. Would you like to proceed?',state:{selectedPlatform:'tiktok',serviceType:'account_setup'},simulation:true};
  else if(path==='/ai/logs')value={items:[],next:null};else if(path==='/ai/usage')value=[];
  else return route.fulfill({status:404,json:{message:'Unexpected fixture route'}});
  return route.fulfill({json:value});
 });
 try{
  await page.setViewportSize({width:1440,height:900});await page.goto('http://localhost:3005/admin-7812er/ai-agent');
  await page.getByRole('button',{name:'Initialize in DRAFT'}).click();await page.getByRole('button',{name:'Add knowledge',exact:true}).waitFor();
  const tabs=page.getByRole('navigation',{name:'AI Agent sections'});
  await tabs.getByRole('button',{name:'Services',exact:true}).click();await page.getByRole('button',{name:/TikTok Ads Account Setup/}).click();
  await page.getByLabel('Price (NGN)',{exact:true}).fill('22000');await page.getByRole('button',{name:'Save entry'}).click();
  assert.equal(records.find(r=>r.key==='tiktok_setup').data.price,22000);
  await tabs.getByRole('button',{name:'Knowledge Base',exact:true}).click();await page.getByRole('button',{name:'Add knowledge'}).click();
  await page.getByLabel('Title',{exact:true}).fill('Working hours');await page.getByLabel('Unique key').fill('hours');await page.getByLabel('Preferred response', {exact:true}).fill('Open weekdays.');await page.getByRole('button',{name:'Save entry'}).click();await page.getByRole('button',{name:/Working hours/}).waitFor();
  await tabs.getByRole('button',{name:'Test Agent',exact:true}).click();await page.getByLabel('Test message',{exact:true}).fill('How much is TikTok setup?');await page.getByRole('button',{name:'Test message',exact:true}).click();await page.getByText('TikTok Ads Account Setup costs ₦20,000. Would you like to proceed?',{exact:true}).waitFor();
  await page.screenshot({path:'artifacts/inbox/ai-admin-desktop.png'});
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByText('AI Settings',{exact:true}).click();await page.getByLabel('Rollout mode').selectOption('OFF');await page.getByRole('button',{name:'Save settings',exact:true}).click();await page.getByText('Settings saved',{exact:true}).waitFor();assert.equal(config.data.mode,'OFF');assert(saved>=3);
  for(const width of [360,390,393,412,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.getByRole('button',{name:'Settings',exact:true}).click();await tabs.getByRole('button',{name:'Knowledge Base',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:/Working hours/}).waitFor();await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'artifacts/inbox/ai-admin-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS: initialize DRAFT, edit service, create knowledge, Test Agent, OFF settings, mobile/desktop layout');
 }catch(error){console.log(await page.locator('body').innerText(), errors);throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
