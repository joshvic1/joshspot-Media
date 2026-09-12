import assert from "node:assert/strict";
import {
  adsPricingConfig,
  calculateTotal,
  generateBreakdownMessage,
  generateSimpleMessage,
} from "../config/adsPricingConfig.mjs";

const managementFeeFor = (advertisingBudget, duration, options = {}) =>
  calculateTotal({
    advertisingBudget,
    duration,
    creativeLimit: options.creativeLimit || 1,
    requestedCreatives: options.requestedCreatives || options.creativeLimit || 1,
    needsScriptSupport: Boolean(options.needsScriptSupport),
    overrideManagementFee: options.overrideManagementFee,
  });

const recommendedPlans = adsPricingConfig.recommendationPresets;

assert.equal(adsPricingConfig.minimumManagementFee, 25000);
assert.equal(recommendedPlans.length, 4);

[
  {
    index: 0,
    duration: 7,
    advertisingBudget: 35000,
    managementFee: 25000,
    creativeLimit: 1,
    total: 60000,
    simple:
      "I recommend you to go for our ₦60k plan. This includes us managing your ads for 7 days. You are allowed 1 video content.",
    breakdownIncludes: [
      "Here's a breakdown.",
      "We will run ₦5,000 for 7 days (That's ₦35,000).",
      "Our service fee for helping you run the ads is ₦25,000.",
      "And you can use up to 1 video content for the ads.",
      "Total amount is ₦60,000",
    ],
  },
  {
    index: 1,
    duration: 10,
    advertisingBudget: 100000,
    managementFee: 50000,
    creativeLimit: 3,
    total: 150000,
    simple:
      "I recommend you to go for our ₦150k plan. This includes us managing your ads for 10 days. You are allowed up to 3 video contents.",
    breakdownIncludes: [
      "Here's a breakdown.",
      "We will run ₦10,000 for 10 days (That's ₦100,000).",
      "Our service fee for helping you run the ads is ₦50,000.",
      "And you can use up to 3 video contents for the ads.",
      "Total amount is ₦150,000",
    ],
  },
  {
    index: 2,
    duration: 15,
    advertisingBudget: 200000,
    managementFee: 85000,
    creativeLimit: 6,
    total: 285000,
    simple:
      "I recommend you to go for our ₦285k plan. This includes us managing your ads for 15 days. You are allowed up to 6 video contents.",
    breakdownIncludes: [
      "Here's a breakdown.",
      "We will run ₦13,333 for 15 days (That's ₦200,000).",
      "Our service fee for helping you run the ads is ₦85,000.",
      "And you can use up to 6 video contents for the ads.",
      "Total amount is ₦285,000",
    ],
  },
  {
    index: 3,
    duration: 30,
    advertisingBudget: 300000,
    managementFee: 150000,
    creativeLimit: 10,
    total: 450000,
    simple:
      "I recommend you to go for our ₦450k plan. This includes us managing your ads for 30 days. You are allowed up to 10 video contents.",
    breakdownIncludes: [
      "Here's a breakdown.",
      "We will run ₦10,000 for 30 days (That's ₦300,000).",
      "Our service fee for helping you run the ads is ₦150,000.",
      "And you can use up to 10 video contents for the ads.",
      "Total amount is ₦450,000",
    ],
  },
].forEach((expected) => {
  const plan = recommendedPlans[expected.index];
  assert.equal(plan.duration, expected.duration);
  assert.equal(plan.advertisingBudget, expected.advertisingBudget);
  assert.equal(plan.managementFee, expected.managementFee);
  assert.equal(plan.creativeLimit, expected.creativeLimit);
  assert.equal(plan.totalPrice, expected.total);

  const result = managementFeeFor(plan.advertisingBudget, plan.duration, {
    creativeLimit: plan.creativeLimit,
    overrideManagementFee: plan.managementFee,
  });

  assert.equal(result.managementFee, expected.managementFee);
  assert.equal(result.total, expected.total);
  assert.equal(generateSimpleMessage(result), expected.simple);

  const breakdown = generateBreakdownMessage(result);
  expected.breakdownIncludes.forEach((line) => {
    assert.ok(breakdown.includes(line), line);
  });
});

assert.equal(managementFeeFor(35000, 7).managementFee, 25000);
assert.equal(managementFeeFor(100000, 7).managementFee, 40000);
assert.equal(managementFeeFor(300000, 7).managementFee, 100000);
assert.equal(managementFeeFor(300000, 15).managementFee, 130000);
assert.equal(managementFeeFor(300000, 30).managementFee, 150000);
assert.equal(managementFeeFor(500000, 30).managementFee, 200000);
assert.equal(managementFeeFor(1000000, 30).managementFee, 350000);

const extraCreativeCase = managementFeeFor(100000, 10, {
  creativeLimit: 3,
  requestedCreatives: 4,
  overrideManagementFee: 50000,
});
assert.equal(extraCreativeCase.extraCreatives, 1);
assert.equal(extraCreativeCase.creativeFee, 10000);
assert.equal(extraCreativeCase.total, 160000);

const scriptSupportCase = managementFeeFor(100000, 10, {
  creativeLimit: 3,
  needsScriptSupport: true,
  overrideManagementFee: 50000,
});
assert.equal(scriptSupportCase.scriptSupportFee, 25000);
assert.equal(scriptSupportCase.total, 175000);

const setupCase = calculateTotal({
  advertisingBudget: 100000,
  duration: 10,
  creativeLimit: 3,
  requestedCreatives: 3,
  needsScriptSupport: false,
  setupFee: 20000,
  overrideManagementFee: 50000,
});
assert.equal(setupCase.setupServiceFee, 20000);
assert.equal(setupCase.total, 170000);
assert.ok(
  generateSimpleMessage(setupCase).includes(
    "Tiktok setup/Customer wants ads straight up & account not set",
  ),
);
assert.ok(
  generateBreakdownMessage(setupCase).includes(
    "We will setup your ads account for you and make it ready to run ads anytime.",
  ),
);

const customDuration = managementFeeFor(250000, 10);
assert.equal(customDuration.managementFee % 5000, 0);

const customBudget = managementFeeFor(850000, 21);
assert.equal(customBudget.managementFee % 5000, 0);

console.log("Updated ads pricing calculator test cases passed.");
