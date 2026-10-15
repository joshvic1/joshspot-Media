const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/**',r=>r.fulfill({json:{invoice:{token:'fixture',status:'pending',amount:10000,accountNumber:'1234567890',bankName:'Test Bank',accountName:'Test Checkout'}}}));
for(const path of ['/course','/whatsapp']){
 await page.goto((process.env.COURSE_TEST_URL||'http://localhost:3005')+path);await page.getByRole('button',{name:/Pay now/}).last().click();
 await page.getByPlaceholder('Your full name').fill('Test Buyer');
 await page.getByRole('button',{name:'Close checkout'}).click();
 await page.getByRole('heading',{name:'Having trouble paying?'}).waitFor();
 if(path==='/whatsapp')await page.screenshot({path:'artifacts/inbox/course-exit-help.png'});
 const href=await page.getByRole('link',{name:'Message Josh on WhatsApp'}).getAttribute('href');
 assert.ok(decodeURIComponent(href).includes(path==='/whatsapp'?'WhatsApp Status adverts':'TikTok, Facebook and Instagram'));
 await page.getByRole('button',{name:'Continue payment'}).click();assert.equal(await page.getByPlaceholder('Your full name').inputValue(),'Test Buyer');
 await page.evaluate(()=>history.back());await page.getByRole('heading',{name:'Having trouble paying?'}).waitFor();
 await page.getByRole('button',{name:'Continue payment'}).click();
 await page.getByRole('button',{name:'Close checkout'}).click();await page.getByRole('button',{name:'Leave payment'}).click();
 await page.getByRole('button',{name:'Close checkout'}).waitFor({state:'detached'});
 await page.waitForTimeout(300);
 await page.getByRole('button',{name:/Pay now/}).last().click();
 await page.evaluate(()=>history.back());await page.getByRole('heading',{name:'Having trouble paying?'}).waitFor();
 await page.evaluate(()=>history.back());await page.getByRole('button',{name:'Close checkout'}).waitFor({state:'detached'});
 await page.getByRole('button',{name:/Pay now/}).last().click();await page.getByPlaceholder('8012345678').fill('8012345678');await page.getByRole('button',{name:'Pay with transfer',exact:true}).click();await page.getByRole('button',{name:'Close checkout'}).click();await page.getByRole('heading',{name:'Having trouble paying?'}).waitFor();await page.getByRole('button',{name:'Continue payment'}).click();await page.getByRole('button',{name:'I have paid',exact:false}).waitFor();
}
assert.deepEqual(errors,[]);console.log('PASS: both products, help link, Continue, retained form, Back, Leave, repeated open, second Back escape');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
