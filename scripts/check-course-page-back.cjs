const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});const base=process.env.COURSE_TEST_URL||'http://localhost:3005';
 await page.route('**/api/**',r=>r.fulfill({json:{}}));
 await page.route('**/exit-test',r=>r.fulfill({contentType:'text/html',body:'<h1>Previous page</h1>'}));
 for(const path of ['/course','/whatsapp'])for(const action of ['leave','back','stay']){
  console.log(path,action);await page.goto(base+'/exit-test');await page.goto(base+path);await page.getByRole('button',{name:/Pay now/}).last().waitFor();await page.waitForFunction(()=>history.state?.coursePaymentGuard);
  await page.evaluate(()=>history.back());await page.getByRole('heading',{name:'Have a question before you go?'}).waitFor();
  assert.ok((await page.getByRole('link',{name:'Message Josh on WhatsApp'}).getAttribute('href')).startsWith('https://wa.me/2347072571740?'));
  if(action==='leave')await page.getByRole('button',{name:'Leave page',exact:true}).click();
  else {if(action==='stay')await page.getByRole('button',{name:'Stay on this page'}).click();await page.evaluate(()=>history.back());}
  await page.waitForURL(base+'/exit-test');
 }
 console.log('PASS: both course pages show help once; Leave, second Back and Back after Stay all reach the actual previous page. Correct WhatsApp number.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
