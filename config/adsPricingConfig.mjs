export const adsPricingConfig = {
  minimumAdBudget: 30000,
  minimumManagementFee: 30000,
  roundingIncrement: 5000,
  scriptSupportPrice: 25000,
  managementFeeAnchors: {
    7: [
      { budget: 30000, fee: 30000 },
      { budget: 50000, fee: 30000 },
      { budget: 100000, fee: 40000 },
      { budget: 150000, fee: 55000 },
      { budget: 200000, fee: 70000 },
      { budget: 300000, fee: 100000 },
      { budget: 500000, fee: 150000 },
      { budget: 700000, fee: 180000 },
      { budget: 1000000, fee: 250000 },
      { budget: 1500000, fee: 325000 },
      { budget: 2000000, fee: 400000 },
    ],
    15: [
      { budget: 50000, fee: 40000 },
      { budget: 100000, fee: 45000 },
      { budget: 150000, fee: 65000 },
      { budget: 200000, fee: 85000 },
      { budget: 300000, fee: 130000 },
      { budget: 500000, fee: 175000 },
      { budget: 700000, fee: 220000 },
      { budget: 1000000, fee: 300000 },
      { budget: 1500000, fee: 375000 },
      { budget: 2000000, fee: 450000 },
    ],
    30: [
      { budget: 50000, fee: 50000 },
      { budget: 100000, fee: 50000 },
      { budget: 150000, fee: 75000 },
      { budget: 200000, fee: 100000 },
      { budget: 300000, fee: 150000 },
      { budget: 500000, fee: 200000 },
      { budget: 700000, fee: 250000 },
      { budget: 1000000, fee: 350000 },
      { budget: 1500000, fee: 425000 },
      { budget: 2000000, fee: 500000 },
      { budget: 3000000, fee: 650000 },
      { budget: 5000000, fee: 900000 },
    ],
  },
  recommendationPresets: [
    {
      key: "quick-test",
      name: "Quick Test",
      totalPrice: 65000,
      duration: 7,
      advertisingBudget: 35000,
      managementFee: 30000,
      creativeLimit: 1,
      recommendedFor: "Low-budget / Just testing",
      enabled: true,
    },
    {
      key: "starter",
      name: "Starter",
      totalPrice: 145000,
      duration: 15,
      advertisingBudget: 100000,
      managementFee: 45000,
      creativeLimit: 1,
      recommendedFor: "Normal first-time advertiser",
      enabled: true,
    },
    {
      key: "growth",
      name: "Growth",
      totalPrice: 430000,
      duration: 15,
      advertisingBudget: 300000,
      managementFee: 130000,
      creativeLimit: 2,
      recommendedFor: "Serious business / Wants stronger campaign",
      enabled: true,
    },
    {
      key: "scale",
      name: "Scale",
      totalPrice: 700000,
      duration: 30,
      advertisingBudget: 500000,
      managementFee: 200000,
      creativeLimit: 3,
      recommendedFor: "High-budget advertiser",
      enabled: true,
    },
    {
      key: "high-budget",
      name: "Custom / High Budget",
      totalPrice: 1350000,
      duration: 30,
      advertisingBudget: 1000000,
      managementFee: 350000,
      creativeLimit: 4,
      recommendedFor: "Custom / High Budget",
      enabled: true,
    },
  ],
  additionalCreativePrices: [
    { quantity: 1, price: 10000 },
    { quantity: 3, price: 25000 },
    { quantity: 5, price: 40000 },
    { quantity: 10, price: 70000 },
  ],
};

export const formatNaira = (amount) =>
  `₦${Math.round(Number(amount || 0)).toLocaleString("en-NG")}`;

export const formatCompactNaira = (amount) => {
  const value = Number(amount || 0);

  if (value >= 1000000) {
    return `₦${Number((value / 1000000).toFixed(1)).toLocaleString("en-NG")}m`;
  }

  if (value >= 1000) {
    return `₦${Number((value / 1000).toFixed(0)).toLocaleString("en-NG")}k`;
  }

  return formatNaira(value);
};

const clampNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
};

const roundToIncrement = (value, increment) =>
  Math.round(value / increment) * increment;

export const interpolateBudgetFee = (budget, anchors) => {
  const adBudget = clampNumber(budget);
  const sortedAnchors = [...anchors].sort((a, b) => a.budget - b.budget);

  if (adBudget <= sortedAnchors[0].budget) {
    return sortedAnchors[0].fee;
  }

  for (let index = 0; index < sortedAnchors.length - 1; index += 1) {
    const lower = sortedAnchors[index];
    const upper = sortedAnchors[index + 1];

    if (adBudget >= lower.budget && adBudget <= upper.budget) {
      const progress = (adBudget - lower.budget) / (upper.budget - lower.budget);
      return lower.fee + progress * (upper.fee - lower.fee);
    }
  }

  const previous = sortedAnchors[sortedAnchors.length - 2];
  const last = sortedAnchors[sortedAnchors.length - 1];
  const slope = (last.fee - previous.fee) / (last.budget - previous.budget);

  return last.fee + (adBudget - last.budget) * slope;
};

export const interpolateDurationFee = (budget, duration, config = adsPricingConfig) => {
  const campaignDays = clampNumber(duration);
  const durationAnchors = Object.keys(config.managementFeeAnchors)
    .map(Number)
    .sort((a, b) => a - b);
  const feeAtDuration = (days) =>
    interpolateBudgetFee(budget, config.managementFeeAnchors[days]);

  if (campaignDays <= durationAnchors[0]) {
    return feeAtDuration(durationAnchors[0]);
  }

  for (let index = 0; index < durationAnchors.length - 1; index += 1) {
    const lowerDays = durationAnchors[index];
    const upperDays = durationAnchors[index + 1];

    if (campaignDays >= lowerDays && campaignDays <= upperDays) {
      const lowerFee = feeAtDuration(lowerDays);
      const upperFee = feeAtDuration(upperDays);
      const progress = (campaignDays - lowerDays) / (upperDays - lowerDays);

      return lowerFee + progress * (upperFee - lowerFee);
    }
  }

  const previousDays = durationAnchors[durationAnchors.length - 2];
  const lastDays = durationAnchors[durationAnchors.length - 1];
  const previousFee = feeAtDuration(previousDays);
  const lastFee = feeAtDuration(lastDays);
  const dailySlope = (lastFee - previousFee) / (lastDays - previousDays);

  return lastFee + (campaignDays - lastDays) * dailySlope;
};

export const getManagementFee = (budget, duration, config = adsPricingConfig) => {
  const fee = interpolateDurationFee(budget, duration, config);
  const roundedFee = roundToIncrement(fee, config.roundingIncrement);

  return Math.max(config.minimumManagementFee, roundedFee);
};

export const calculateCreativeFee = (
  requestedCreatives,
  includedCreatives,
  config = adsPricingConfig,
) => {
  const extraCreatives = Math.max(
    0,
    Math.ceil(clampNumber(requestedCreatives)) - Math.ceil(clampNumber(includedCreatives)),
  );

  if (extraCreatives === 0) {
    return { extraCreatives, creativeFee: 0 };
  }

  const bundles = [...config.additionalCreativePrices].sort(
    (a, b) => b.quantity - a.quantity,
  );
  let remaining = extraCreatives;
  let creativeFee = 0;

  bundles.forEach((bundle) => {
    if (remaining >= bundle.quantity) {
      const bundleCount = Math.floor(remaining / bundle.quantity);
      creativeFee += bundleCount * bundle.price;
      remaining -= bundleCount * bundle.quantity;
    }
  });

  return { extraCreatives, creativeFee };
};

export const calculateTotal = ({
  advertisingBudget,
  duration,
  creativeLimit,
  requestedCreatives,
  needsScriptSupport,
  overrideAdvertisingBudget,
  overrideDuration,
  overrideCreativeLimit,
  overrideManagementFee,
}) => {
  const finalAdvertisingBudget = clampNumber(
    overrideAdvertisingBudget || advertisingBudget,
  );
  const finalDuration = Math.max(1, clampNumber(overrideDuration || duration, 1));
  const finalCreativeLimit = Math.max(
    0,
    Math.ceil(clampNumber(overrideCreativeLimit || creativeLimit)),
  );
  const calculatedManagementFee = getManagementFee(
    finalAdvertisingBudget,
    finalDuration,
  );
  const finalManagementFee = clampNumber(
    overrideManagementFee || calculatedManagementFee,
  );
  const { extraCreatives, creativeFee } = calculateCreativeFee(
    requestedCreatives,
    finalCreativeLimit,
  );
  const scriptSupportFee = needsScriptSupport
    ? adsPricingConfig.scriptSupportPrice
    : 0;
  const addOnsTotal = creativeFee + scriptSupportFee;
  const total = finalAdvertisingBudget + finalManagementFee + addOnsTotal;

  return {
    advertisingBudget: finalAdvertisingBudget,
    duration: finalDuration,
    creativeLimit: finalCreativeLimit,
    requestedCreatives: Math.ceil(clampNumber(requestedCreatives)),
    calculatedManagementFee,
    managementFee: finalManagementFee,
    managementRatio:
      finalAdvertisingBudget > 0
        ? (finalManagementFee / finalAdvertisingBudget) * 100
        : 0,
    extraCreatives,
    creativeFee,
    scriptSupportFee,
    addOnsTotal,
    total,
  };
};

const creativeText = (count) =>
  `${count} video content${Number(count) === 1 ? "" : "s"}`;

export const generateSimpleMessage = (result) =>
  `I recommend you to go for our ${formatCompactNaira(
    result.total,
  )} plan. This includes us managing your ads for ${
    result.duration
  } days. You are allowed a max of ${creativeText(result.creativeLimit)}.`;

export const generateBreakdownMessage = (result) => {
  const lines = [
    `Ads duration: ${result.duration} days`,
    `Advertising Budget: ${formatNaira(result.advertisingBudget)}`,
    `Campaign Management: ${formatNaira(result.managementFee)}`,
    `${creativeText(result.creativeLimit)} allowed.`,
  ];

  if (result.extraCreatives > 0) {
    lines.push(
      `Additional video content (${result.extraCreatives}): ${formatNaira(
        result.creativeFee,
      )}`,
    );
  }

  if (result.scriptSupportFee > 0) {
    lines.push(`Creative/Script Support: ${formatNaira(result.scriptSupportFee)}`);
  }

  lines.push(
    "",
    `Total amount: ${formatNaira(result.total)}`,
    "",
    "This management fee covers campaign setup, audience targeting, monitoring, optimization, targeting adjustments and retargeting where appropriate throughout the campaign period.",
    "",
    "Please note that ad results also depend on your content, offer, audience, pricing and other factors.",
  );

  return lines.join("\n");
};
