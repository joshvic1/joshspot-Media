// Synthetic fixtures only. Both server rendering and browser APIs use local data.
const {chromium}=require('playwright');
const http=require('node:http');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const image=fs.readFileSync(path.resolve('public/images/ads-management.jpg'));
const imageUrl='/api/blog/images/aaaaaaaaaaaaaaaaaaaaaaaa';
const posts=[{_id:'bbbbbbbbbbbbbbbbbbbbbbbb',title:'A smarter starting point for your next ad campaign',slug:'a-smarter-start',excerpt:'Good advertising starts with a clear goal. Here is how to turn your next idea into a focused campaign.',category:'Advertising',cover:imageUrl,coverAlt:'Advertising workspace',status:'published',__v:0,html:'<h2>Start with one clear goal</h2><p>You do not have to do everything at once. Start with a useful message and a clear next step.</p><p><strong>Know who you want to reach.</strong> Then build a campaign around what matters to them.</p><img src="'+imageUrl+'" alt="Campaign planning"><h2>Make every message count</h2><p>Keep learning from what your audience tells you.</p>',seoTitle:'',seoDescription:''},{_id:'cccccccccccccccccccccccc',title:'Give your content a clearer direction',slug:'content-direction',excerpt:'Simple ways to connect what you publish with what your customers need.',category:'Content',status:'published',cover:'',html:'<p>A useful guide.</p>'},{_id:'dddddddddddddddddddddddd',title:'What to ask before you run your first campaign',slug:'first-campaign',excerpt:'A practical checklist for your next move.',category:'Strategy',status:'published',cover:'',html:'<p>A checklist.</p>'}];
let next,fixture,browser;let adminPosts=[];
(async()=>{
 fixture=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');const route=url.pathname.replace('/api/blog','');
  res.setHeader('Content-Type','application/json');
  if(route.startsWith('/images/')){res.setHeader('Content-Type','image/jpeg');return res.end(image);}
  if(route==='/posts')return res.end(JSON.stringify({items:posts,total:3,pages:1,page:1}));
  if(route==='/sitemap-info')return res.end(JSON.stringify({pages:1}));
  if(route==='/sitemap')return res.end(JSON.stringify(posts.map(({slug})=>({slug}))));
  const post=posts.find(p=>route==='/posts/'+p.slug);if(post)return res.end(JSON.stringify(post));
  res.statusCode=404;res.end('{}');
 });await new Promise(r=>fixture.listen(3098,'127.0.0.1',r));
 next=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3025'],{env:{...process.env,BACKEND_API_URL:'http://127.0.0.1:3098/api'},stdio:'pipe',windowsHide:true});
 let startup='';next.stdout.on('data',d=>startup+=d);next.stderr.on('data',d=>startup+=d);
 for(let i=0;i<60;i++){try{if((await fetch('http://localhost:3025/blog')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));if(i===59)throw Error(startup);}
 const raw=await (await fetch('http://localhost:3025/blog/a-smarter-start')).text();assert.ok(raw.includes('Start with one clear goal'));assert.ok(raw.includes('application/ld+json'));assert.ok(raw.includes('rel="canonical"'));assert.ok(!raw.includes('datePublished'));
 assert.equal((await fetch('http://localhost:3025/blog/unpublished')).status,404);
 const sitemap=await (await fetch('http://localhost:3025/sitemaps/blog-1.xml')).text();assert.ok(sitemap.includes('/blog/a-smarter-start'));
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('adminToken','fixture-only'));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(!['localhost','127.0.0.1'].includes(url.hostname))return route.fulfill({status:200,body:''});
  if(!url.pathname.startsWith('/api/'))return route.continue();
  if(url.pathname.startsWith('/api/blog/images/'))return route.fulfill({contentType:'image/jpeg',body:image});
  const p=url.pathname.replace('/api/blog/admin/',''),method=route.request().method(),body=route.request().postDataJSON();
  if(p==='images')return route.fulfill({json:{url:imageUrl}});
  if(p==='posts'&&method==='POST'){const saved={...body,_id:'eeeeeeeeeeeeeeeeeeeeeeee',__v:0};adminPosts=[saved];return route.fulfill({status:201,json:saved});}
  if(p.startsWith('posts/')&&method==='PUT'){adminPosts=[{...body,__v:body.__v+1}];return route.fulfill({json:adminPosts[0]});}
  if(p==='posts')return route.fulfill({json:{items:adminPosts,pages:1,total:adminPosts.length,drafts:adminPosts.filter(p=>p.status==='draft').length,published:adminPosts.filter(p=>p.status==='published').length}});
  if(p.startsWith('posts/'))return route.fulfill({json:adminPosts[0]});
  return route.fulfill({json:{}});
 });
 fs.mkdirSync('artifacts/blog',{recursive:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:3025/blog');await page.getByRole('heading',{name:'Good ideas. Better marketing.'}).waitFor();await page.screenshot({path:'artifacts/blog/journal-desktop.png',fullPage:true});
 await page.goto('http://localhost:3025/blog/a-smarter-start');await page.getByRole('heading',{name:'Start with one clear goal'}).waitFor();await page.screenshot({path:'artifacts/blog/article-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/blog/article-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.goto('http://localhost:3025/blog');await page.screenshot({path:'artifacts/blog/journal-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:3025/admin-7812er/blog');await page.getByRole('button',{name:'Write an article'}).click();
 await page.getByRole('textbox',{name:'Article title',exact:true}).fill('A practical guide to better ads');
 const editor=page.getByRole('textbox',{name:'Article content'});await editor.fill('Start with your audience.');
 await editor.press('End');await editor.press('Enter');
 await editor.evaluate(el=>{const data=new DataTransfer();data.setData('text/html','<h2>A clear message</h2><p>Keep <strong>learning</strong> every day.</p>');el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});
 await page.getByRole('button',{name:'Insert image',exact:true}).click({trial:true});
 await page.locator('input[type=file]').first().setInputFiles('public/images/ads-management.jpg');
 await editor.locator('img').waitFor();await editor.click();await editor.press('Control+End');await editor.press('Enter');await editor.pressSequentially('Continue the story after the image.');
 await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved.',{exact:true}).waitFor();assert.ok(adminPosts[0].html.includes('<strong>learning</strong>'));assert.ok(adminPosts[0].html.includes('Continue the story'));assert.ok(adminPosts[0].html.includes('<img'));
 await page.screenshot({path:'artifacts/blog/editor-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByRole('button',{name:'Close preview'}).click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/blog/editor-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Publish article',exact:true}).click();await page.getByRole('status').filter({hasText:'Your article is published.'}).waitFor();assert.equal(adminPosts[0].status,'published');
 await page.getByRole('button',{name:'Articles',exact:true}).click();await page.getByRole('button',{name:/A practical guide to better ads/}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS: server-rendered articles, 404 drafts, sitemap, formatted paste, inline image + continued typing, draft save, preview, publish, desktop/mobile bounds.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(next)next.kill();if(fixture)await new Promise(r=>fixture.close(r));});
