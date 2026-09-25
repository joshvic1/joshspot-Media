const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let upstream, fail=false, requested;
const context=vm.createContext({AbortSignal,fetch:async(url,options)=>{requested={url,options};if(fail)throw Error('Network unavailable');return upstream;}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../pages/api/pay-invoice/[token].js'),'utf8').replace('export default async function handler','async function handler'),context);
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
async function call(method='GET',token='invoice-test'){const res=response();await context.handler({method,query:{token}},res);return res;}
(async()=>{
  upstream={ok:true,status:200,json:async()=>({token:'invoice-test',amount:135000,status:'pending',accountNumber:'1234567890'})};
  let res=await call();assert.equal(res.code,200);assert.equal(res.data.amount,135000);assert.equal(res.headers['Cache-Control'],'no-store');assert.equal(requested.options.headers.authorization,undefined);
  upstream={ok:false,status:404};res=await call();assert.equal(res.code,404);
  upstream={ok:false,status:500};res=await call();assert.equal(res.code,502);assert.match(res.data.message,/temporarily unavailable/);
  upstream={ok:true,status:200,json:async()=>({})};assert.equal((await call()).code,502);
  fail=true;res=await call();assert.equal(res.code,502);assert.match(res.data.message,/reach/);
  assert.equal((await call('POST')).code,405);assert.equal((await call('GET','')).code,400);
  console.log('Invoice proxy checks passed: valid invoice, genuine 404, server failure, malformed response, network failure, method and token validation. No live payments.');
})().catch(error=>{console.error(error);process.exitCode=1;});
