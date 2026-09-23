const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../pages/api/course-question.js'),'utf8').replace('export default async function handler','async function handler');
let request;
const env = {OPENAI_API_KEY:'mock'};
const context = vm.createContext({process:{env},console,fetch:async (url,options) => {
  request=JSON.parse(options.body);
  return {ok:true,json:async()=>({output:[{content:[{text:'Course-specific answer'}]}]})};
}});
vm.runInContext(source,context);
const response = () => ({code:200,setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
(async()=>{
  let res=response(); await context.handler({method:'POST',body:{product:'whatsapp-course',question:'How much and where do I learn?'}},res);
  assert.equal(res.code,200); assert.equal(res.data.answer,'Course-specific answer');
  assert.ok(request.input[0].content.includes('₦10,000'));
  assert.ok(request.input[0].content.includes('Training is delivered in a Telegram channel'));
  assert.ok(!request.input[0].content.includes('https://t.me/'));
  res=response(); await context.handler({method:'POST',body:{question:'What does the ads course cover?'}},res);
  assert.ok(request.input[0].content.includes('₦8,000')); assert.ok(!request.input[0].content.includes('₦10,000'));
  delete env.OPENAI_API_KEY;
  res=response(); await context.handler({method:'POST',body:{product:'whatsapp-course',question:'Access?'}},res);
  assert.ok(res.data.answer.includes('₦10,000')); assert.ok(res.data.answer.includes('Telegram'));
  for (const body of [{question:''},{question:'x'.repeat(2001)},{question:'Hi',product:'invalid'}]) {
    res=response(); await context.handler({method:'POST',body},res); assert.equal(res.code,400);
  }
  console.log('Course question checks passed: course-specific AI context, Telegram access, fallback and input validation. No live AI calls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
