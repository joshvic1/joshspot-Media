import assert from "node:assert/strict";
import { canAccessCalculator, verifyCalculatorAccess } from "../utils/calculatorAccess.mjs";
for (const staff of [{role:"CSS"},{role:"ADMIN"},{admin:true}]) assert.equal(canAccessCalculator(staff),true);
for (const staff of [null,{}, {role:"SES"},{role:"SETUP"},{role:"SALES"},{admin:"true"},{role:"css"}]) assert.equal(canAccessCalculator(staff),false);
assert.equal(await verifyCalculatorAccess(null,"https://example.test/api",()=>{throw Error("Should not fetch");}),401);
for (const [staff,expected] of [[{role:"CSS"},200],[{admin:true},200],[{role:"ADMIN"},200],[{role:"SES"},403],[{},403]]) {
  const status=await verifyCalculatorAccess("test-token","https://example.test/api",async(url,options)=>{
    assert.equal(url,"https://example.test/api/crm/session");
    assert.equal(options.headers.authorization,"test-token");
    return {ok:true,status:200,json:async()=>({staff})};
  });
  assert.equal(status,expected);
}
assert.equal(await verifyCalculatorAccess("expired","https://example.test",async()=>({ok:false,status:401})),401);
assert.equal(await verifyCalculatorAccess("token","https://example.test",async()=>({ok:false,status:500})),502);
console.log("PASS: CSS/admin allowed; setup, other roles, unsigned and expired sessions blocked; backend failure fails closed.");
