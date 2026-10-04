const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const admin of [true,false]){
   const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>localStorage.setItem('adminToken','fixture-only'));
   let deleted=false,calls=0;const now=new Date().toISOString();
   const c={_id:'delete1',contact:{_id:'contact1',name:'Delete Test',phone:'2348000000000',status:'lead'},assignedTo:'staff1',status:'open',labels:[],lastMessageAt:now,lastInboundAt:now,createdAt:now,preview:'Fixture message'};
   await page.route('**/api/inbox/**',async route=>{
    const p=new URL(route.request().url()).pathname.replace('/api/inbox','');let body={ok:true};
    if(p==='/session')body={actor:{id:admin?'admin':'staff1',name:'Tester',role:admin?'ADMIN':'CSS',admin},staff:[],provider:{configured:true,missing:[]}};
    else if(p==='/events-ticket')return route.fulfill({status:503,json:{message:'fixture'}});
    else if(p==='/notifications')body={items:[],unread:0};
    else if(p==='/counts')body={inbox:deleted?0:1};
    else if(p==='/conversations')body={items:deleted?[]:[c],next:null};
    else if(p==='/conversations/delete1'&&route.request().method()==='DELETE'){assert.deepEqual(route.request().postDataJSON(),{confirm:true});calls++;deleted=true;}
    else if(p==='/conversations/delete1')body=c;
    else if(p.endsWith('/messages'))body={items:[],more:false,next:null};
    else if(p.endsWith('/crm'))body=[];
    return route.fulfill({json:body});
   });
   await page.goto('http://localhost:3005/crm-inbox');await page.getByRole('button',{name:/Delete Test/}).click();
   await page.getByLabel('Conversation actions',{exact:true}).click();
   if(admin){
    await page.getByRole('button',{name:'Delete chat',exact:true}).click();
    await page.getByRole('dialog',{name:'Delete chat permanently?'}).waitFor();
    await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(calls,0);
    await page.getByLabel('Conversation actions',{exact:true}).click();await page.getByRole('button',{name:'Delete chat',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:'artifacts/inbox/delete-chat-confirmation.png'});
    await page.getByRole('button',{name:'Yes, delete chat',exact:true}).click();await page.getByText('A clear inbox',{exact:true}).waitFor();assert.equal(calls,1);
   }else assert.equal(await page.getByRole('button',{name:'Delete chat',exact:true}).count(),0);
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS: admin-only delete menu, cancellation, confirmation, mobile fit and cleared Inbox');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
