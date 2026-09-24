import { getRecommendedPlans, formatNaira } from "./adsPricingConfig.mjs";

// Use the default recommended prices, independent of the current calculator inputs.
const plans = getRecommendedPlans();
const planList = plans.map(plan => `${plan.duration} days – ${formatNaira(plan.totalPrice)}`).join("\n");
const planSummary = new Intl.ListFormat("en", { style: "long", type: "disjunction" }).format(
  plans.map(plan => `${formatNaira(plan.totalPrice)} for ${plan.duration} days`),
);
export const quickReplies = [
  {id:"needs",title:"Ask What They Need",message:`Do you want us to setup the ads account for you, then after that, we teach you how to run the ads yourself
OR
You want us to just run the ads for you straight up.`},
  {id:"setup",title:"Setup Only – ₦20,000",message:"For the TikTok Ads Manager setup, we charge ₦20,000. This includes setting up the account for you and teaching you how to run the ads yourself afterwards."},
  {id:"management",title:"Run Ads for Customer",message:`For us to run and manage the ads for you, you can choose from any of our recommended plans:

${planList}

The prices include both the advertising budget and our management fee.`},
  {id:"setup-management",title:"Setup + Ads Management",message:`TikTok ads

For the setup, we charge ₦20,000.

For us to run and manage the ads for you, our recommended plans are ${planSummary}. This includes the ads fee and our service fee.

If you want both the setup and ads management, the ₦20,000 setup fee will be added to whichever ads plan you choose.`},
];
