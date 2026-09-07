import assert from "node:assert/strict";
import { calculateTotal } from "../config/adsPricingConfig.mjs";

const managementFeeFor = (advertisingBudget, duration, options = {}) =>
  calculateTotal({
    advertisingBudget,
    duration,
    creativeLimit: options.creativeLimit || 1,
    requestedCreatives: options.requestedCreatives || options.creativeLimit || 1,
    needsScriptSupport: Boolean(options.needsScriptSupport),
  });

assert.equal(managementFeeFor(100000, 7).managementFee, 40000);
assert.equal(managementFeeFor(300000, 7).managementFee, 100000);
assert.equal(managementFeeFor(300000, 15).managementFee, 130000);
assert.equal(managementFeeFor(300000, 30).managementFee, 150000);
assert.equal(managementFeeFor(500000, 30).managementFee, 200000);
assert.equal(managementFeeFor(1000000, 30).managementFee, 350000);
assert.equal(managementFeeFor(2000000, 30).managementFee, 500000);

const case8 = managementFeeFor(100000, 15);
assert.equal(case8.managementFee, 45000);
assert.equal(case8.total, 145000);

const case9 = managementFeeFor(100000, 15, { needsScriptSupport: true });
assert.equal(case9.advertisingBudget, 100000);
assert.equal(case9.managementFee, 45000);
assert.equal(case9.scriptSupportFee, 25000);
assert.equal(case9.total, 170000);

const case10 = managementFeeFor(250000, 10);
assert.equal(case10.managementFee % 5000, 0);
assert.ok(case10.managementFee > 85000);
assert.ok(case10.managementFee < 125000);

const case11 = managementFeeFor(850000, 21);
assert.equal(case11.managementFee % 5000, 0);
assert.ok(case11.managementFee > 250000);
assert.ok(case11.managementFee < 325000);

console.log("Ads pricing calculator test cases passed.");
