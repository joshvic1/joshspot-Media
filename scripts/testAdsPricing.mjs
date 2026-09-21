import assert from "node:assert/strict";
import {quickReplies} from "../config/quickReplies.mjs";
import {adsPricingConfig as c, calculateTotal, getBaseManagementFee, getDurationMultiplier, generateSimpleMessage, generateBreakdownMessage, generateRecommendationGuide, getRecommendedPlans} from "../config/adsPricingConfig.mjs";
const quote=(budget,days=7,count=2,creativeMode="testing",extra={})=>calculateTotal({advertisingBudget:budget,duration:days,requestedCreatives:count,creativeMode,...extra});
const cases=[
  [35000,7,1,"testing",35000,25000,0,60000],
  [35000,7,2,"testing",35000,25000,0,60000],
  [35000,7,2,"individual",70000,25000,10000,105000],
  [150000,10,2,"testing",150000,35000,0,185000],
  [150000,30,2,"testing",150000,55000,0,205000],
  [300000,10,2,"testing",300000,75000,0,375000],
  [300000,30,2,"testing",300000,115000,0,415000],
  [150000,10,3,"individual",450000,90000,15000,555000],
  [35000,7,1,"individual",35000,25000,5000,65000],
];
for(const [budget,days,count,mode,ad,management,creative,total] of cases) {
 const r=quote(budget,days,count,mode);
 assert.equal(r.valid,true); assert.equal(r.advertisingBudget,ad); assert.equal(r.managementFee,management);
 assert.equal(r.creativeFee,creative); assert.equal(r.total,total);
 console.log(JSON.stringify({budget,days,count,mode,ad,management,creative,total}));
}
const boundaries=[[99999,25000],[99999.99,25000],[100000,30000],[199999,30000],[199999.99,30000],[200000,50000],[299999,50000],[300000,65000],[399999,65000],[400000,80000],[499999,80000],[500000,100000],[500001,100000],[750000,150000],[1000000,200000],[2000000,400000]];
for(const [budget,fee] of boundaries) {assert.equal(getBaseManagementFee(budget),fee);console.log("BASE",budget,fee);}
for(const {days,multiplier} of c.durationAnchors) assert.ok(Math.abs(getDurationMultiplier(days)-multiplier)<1e-12);
for(const [days,multiplier] of [[1,1],[6,1],[8,1.05],[9,1.10],[11,1.18],[12,1.21],[18,1.4],[24,1.5833333333333333],[31,1.7777777777777777],[39,2]]) assert.ok(Math.abs(getDurationMultiplier(days)-multiplier)<1e-12);
for(let d=1;d<365;d++) assert.ok(getDurationMultiplier(d+1)>=getDurationMultiplier(d));
assert.equal(quote(150000,10).baseManagementFee,30000);assert.equal(quote(150000,10).durationMultiplier,1.15);
assert.equal(quote(500001,30).managementFee,175000);
assert.equal(quote(150000,1).managementFee,30000);
assert.ok(quote(150000,31).managementFee>=quote(150000,30).managementFee);
const snapshot=JSON.stringify(c.recommendationPresets);
for(const p of c.recommendationPresets) {
 const r=calculateTotal({mode:"recommend",planKey:p.key,requestedCreatives:2});
 const expected={7:[25000,60000],10:[35000,135000],15:[65000,265000],30:[115000,415000]}[p.duration];
 assert.equal(r.total,expected[1]);assert.equal(r.managementFee,expected[0]);
 assert.equal(r.total,quote(p.advertisingBudget,p.duration).total);
 const display=getRecommendedPlans().find(item=>item.key===p.key);assert.equal(display.totalPrice,r.total);
 console.log("RECOMMENDED",p.duration,r.managementFee,r.total);
 const individual=calculateTotal({mode:"recommend",planKey:p.key,creativeMode:"individual",requestedCreatives:3,overrideManagementFee:1});
 assert.equal(individual.advertisingBudget,p.advertisingBudget*3);
 const matchingCustom=quote(p.advertisingBudget,p.duration,3,"individual");
 assert.equal(individual.managementFee,matchingCustom.managementFee);assert.equal(individual.creativeFee,15000);
 assert.equal(individual.total,matchingCustom.total);
}
assert.equal(JSON.stringify(c.recommendationPresets),snapshot);
const extras=quote(35000,7,2,"individual",{needsScriptSupport:true,setupFee:20000});
assert.equal(extras.total,150000);assert.equal(extras.addOnsTotal,45000);
const manual=quote(35000,7,2,"individual",{overrideAdvertisingBudget:150000,overrideDuration:10,overrideCreativeLimit:3,overrideManagementFee:100000});
assert.equal(manual.advertisingBudget,450000);assert.equal(manual.duration,10);assert.equal(manual.creativeFee,15000);assert.equal(manual.total,565000);assert.equal(manual.manualAdjustment,true);
for(const budget of ["",0,-10,"abc",Infinity,NaN,1000000001,35.001]) assert.equal(quote(budget).valid,false,"invalid budget "+budget);
for(const days of ["",0,-1,1.5,366,Infinity]) assert.equal(quote(35000,days).valid,false);
for(const count of ["",0,-1,1.5,101,Infinity]) assert.equal(quote(35000,7,count,"individual").valid,false);
assert.equal(quote(35000,7,3,"testing").valid,false);
assert.equal(quote(35000,7,2,"testing",{overrideCreativeLimit:3}).valid,false);
assert.equal(quote(35000,7,2,"testing",{overrideManagementFee:0}).valid,false);
assert.equal(quote(35000,7,2,"testing",{overrideAdvertisingBudget:"0"}).valid,false);
assert.equal(quote(35000,7,2,"testing",{overrideManagementFee:24999}).valid,false);
assert.equal(quote(35000,7,2,"testing",{setupFee:-1}).valid,false);
assert.equal(quote(1000000000,7,2,"individual").valid,false);
assert.equal(calculateTotal({mode:"recommend",planKey:"missing"}).valid,false);
assert.equal(quote(35000.50).total,60000.50);
assert.equal(quote(1).valid,true);assert.ok(quote(1).warnings.length);
assert.equal(quote(35000,7,2,"unknown").valid,false);
assert.equal(generateSimpleMessage(quote("")),"");
const individual=quote(150000,10,3,"individual");
const breakdown=generateBreakdownMessage(individual);
assert.ok(breakdown.includes("₦150,000 for 10 days"));assert.ok(breakdown.includes("₦450,000 for 3 videos"));
assert.ok(breakdown.includes("₦105,000"));assert.ok(!breakdown.includes("daily"));
assert.ok(generateBreakdownMessage(extras).includes("Content script support: ₦25,000"));assert.ok(generateBreakdownMessage(extras).includes("TikTok Ads Manager setup: ₦20,000"));
const one=generateSimpleMessage(quote(35000,1,1));
assert.ok(one.includes("1 day."));assert.ok(one.includes("1 video"));assert.ok(!one.includes("1 days"));
for(const generate of [generateSimpleMessage,generateBreakdownMessage]) {
 const text=generate(quote(35000));
 assert.ok(!text.includes("for testing"));assert.ok(!text.includes("The platform prioritizes performance"));
 assert.ok(text.includes("Throughout the 7 days, we will create and manage the ads for you"));
 assert.ok(generate(quote(150000,10)).includes("Throughout the 10 days"));
 assert.ok(generate(quote(35000,1,1)).includes("Throughout the day"));
}
for(const text of [breakdown,generateSimpleMessage(individual)]) assert.ok(!/multiplier|20%|1.15|margin|formula/.test(text));
const guide=generateRecommendationGuide({setupFee:20000,needsScriptSupport:true});
assert.ok(guide.includes("7 days — ₦105,000"));assert.ok(guide.includes("10 days — ₦180,000"));assert.ok(guide.includes("15 days — ₦310,000"));assert.ok(guide.includes("30 days — ₦460,000"));assert.ok(guide.includes("up to 2 videos"));assert.ok(!guide.includes("10 video"));
console.log("PASS: exact scenarios, all budget boundaries, duration anchors/interpolation/extension, recommended/custom parity, add-ons, overrides, validation, decimals, singular/plural and customer messages.");
const daily=quote(5000,7,2,"testing",{budgetType:"daily"});
assert.equal(daily.advertisingBudget,35000);assert.equal(daily.total,60000);
assert.equal(quote(5000,10,2,"testing",{budgetType:"daily"}).total,80000);
assert.equal(quote(5000,7,2,"individual",{budgetType:"daily"}).total,105000);
assert.equal(quote(5000,7,2,"testing",{budgetType:"daily",overrideDuration:10}).advertisingBudget,50000);
assert.equal(quote(5000,7,2,"testing",{budgetType:"daily",overrideAdvertisingBudget:100000}).advertisingBudget,100000);
assert.equal(quote(5000.01,7,2,"testing",{budgetType:"daily"}).advertisingBudget,35000.07);
for(const budget of ["",0,-1,35.001,Infinity]) assert.equal(quote(budget,7,2,"testing",{budgetType:"daily"}).valid,false);
assert.equal(quote(100000000,30,2,"testing",{budgetType:"daily"}).valid,false);
assert.equal(quote(5000,0,2,"testing",{budgetType:"daily"}).valid,false);
assert.equal(quote(5000,7,2,"testing",{budgetType:"invalid"}).valid,false);
assert.ok(generateSimpleMessage(daily).includes("₦60,000"));
assert.ok(generateBreakdownMessage(daily).includes("₦5,000 daily for 7 days"));
assert.equal(quickReplies.length,4);assert.equal(new Set(quickReplies.map(reply=>reply.id)).size,4);
assert.ok(quickReplies[0].message.includes("\nOR\n"));
assert.ok(quickReplies[2].message.includes("10 days – ₦150,000"));
assert.ok(quickReplies[3].message.includes("₦450,000 for 30 days"));
console.log("PASS: daily normalization, duration changes, individual videos, overrides, decimal/invalid budgets and four independent static templates.");

