const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const events=[],storage=new Map();
const pixel={page:()=>events.push({event:'PageView'}),track:(event,data,options)=>events.push({event,data,options})};
const window={location:{pathname:'/course',hostname:'joshspotmedia.com',search:''},crypto:require('node:crypto').webcrypto,
  localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
  ttq:{load(){},_i:{D8PHSLRC77UCDHMP5VU0:pixel},instance:()=>pixel},fbq(){},snaptr(){}};
const context=vm.createContext({window,URLSearchParams,TextEncoder,document:{createElement:()=>({}),head:{appendChild(){}}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../utils/coursePixel.js'),'utf8').replace(/export /g,''),context);
(async()=>{
  for(const [pathname,product,amount] of [['/course','ads-course',8000],['/whatsapp','whatsapp-course',10000]]) {
    window.location.pathname=pathname;
    const start=events.length;
    for(const event of ['PageView','ViewContent','InitiateCheckout','Lead','CoursePaymentCheck','CoursePaymentDetailsCopied','CourseQuestionAnswered','CourseLinksEmailed','CourseTelegramClick'])context.trackCourse(event,{value:amount},{once:event});
    assert.equal(events.length-start,9);
    assert.equal(events.at(-1).data.content_ids[0],product);
    assert.ok(events.slice(start).some(e=>e.event==='SubmitForm'));
    const invoice={status:'paid',token:product,amount};
    await context.trackCoursePurchase({...invoice,status:'pending'});assert.equal(events.length-start,9);
    await context.trackCoursePurchase(invoice);assert.equal(events.at(-1).event,'Purchase');assert.equal(events.at(-1).data.value,amount);assert.equal(events.at(-1).data.content_ids[0],product);
    assert.equal(events.at(-1).options.event_id,'course-'+require('node:crypto').createHash('sha256').update(product).digest('hex'));
    const count=events.length;await context.trackCoursePurchase(invoice);assert.equal(events.length,count);
  }
  const count=events.length;window.location.search='?preview=paid';context.trackCourse('Lead');await context.trackCoursePurchase({status:'paid',token:'preview',amount:10000});assert.equal(events.length,count);
  window.location.search='';window.location.hostname='localhost';context.trackCourse('Lead');assert.equal(events.length,count);
  console.log('Both course pages passed: all TikTok events, product/value, paid-only Purchase, shared event IDs, duplicate suppression, preview and localhost exclusions. No live events sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
