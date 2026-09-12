import { useMemo, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import {
  adsPricingConfig,
  calculateTotal,
  creativeAllowanceText,
  formatCompactNaira,
  formatNaira,
  generateBreakdownMessage,
  generateSimpleMessage,
} from "../config/adsPricingConfig.mjs";
import { services } from "../config/services";
import styles from "../styles/AdsCalculator.module.css";

const recommendedPlans = adsPricingConfig.recommendationPresets.filter(
  (preset) => preset.enabled,
);

const setupService = services.find(
  (service) => service.title === "TikTok/Meta Ads Account Setup",
);
const tikTokSetupOption = setupService?.options?.find(
  (option) => option.label === "TikTok only",
);
const tikTokSetupFee = tikTokSetupOption?.price || 0;

const setupAddonLabel = "Tiktok setup/Customer wants ads straight up & account not set";

const buildRecommendationGuideText = (setupFee = 0) => `For the ads

You should be the one to tell us your budget and how much ads you want to run and for how many days, But if you're not sure of how much to start with, you can choose from any of our recommended plans below:

7 days – ${formatNaira(60000 + setupFee)}
2 video content

10 days – ${formatNaira(150000 + setupFee)}
Up to 4 video contents

15 days – ${formatNaira(285000 + setupFee)}
Up to 6 video contents

30 days – ${formatNaira(450000 + setupFee)}
Up to 10 video contents

Note:

1. These are only our recommended plans. You can also customize how much you want us to spend on the ads daily and how many days you want us to run them for.

2. There's no best or worst amount to spend on ads. Just know that, the more you spend, the more people will see your ads and the better the results.

Let us know which of the options you'd like to go for.`;

export default function AdsCalculator() {
  const [mode, setMode] = useState("recommend");
  const [selectedPlanKey, setSelectedPlanKey] = useState(
    recommendedPlans[0]?.key,
  );
  const [needsSetup, setNeedsSetup] = useState(false);
  const [messageView, setMessageView] = useState("simple");
  const [copiedKey, setCopiedKey] = useState("");
  const [customInputs, setCustomInputs] = useState({
    advertisingBudget: "100000",
    duration: "15",
    requestedCreatives: "1",
    creativeLimit: "1",
    needsScriptSupport: false,
    overrideAdvertisingBudget: "",
    overrideDuration: "",
    overrideCreativeLimit: "",
    overrideManagementFee: "",
  });

  const activePlan = useMemo(
    () =>
      recommendedPlans.find((plan) => plan.key === selectedPlanKey) ||
      recommendedPlans[0],
    [selectedPlanKey],
  );
  const setupFee = needsSetup ? tikTokSetupFee : 0;
  const recommendationGuideText = useMemo(
    () => buildRecommendationGuideText(setupFee),
    [setupFee],
  );

  const result = useMemo(() => {
    if (mode === "recommend") {
      return calculateTotal({
        advertisingBudget: activePlan.advertisingBudget,
        duration: activePlan.duration,
        creativeLimit: activePlan.creativeLimit,
        requestedCreatives: activePlan.creativeLimit,
        needsScriptSupport: customInputs.needsScriptSupport,
        setupFee,
        overrideManagementFee: activePlan.managementFee,
      });
    }

    return calculateTotal({
      ...customInputs,
      setupFee,
    });
  }, [activePlan, customInputs, mode, needsSetup]);

  const simpleMessage = useMemo(() => generateSimpleMessage(result), [result]);
  const breakdownMessage = useMemo(
    () => generateBreakdownMessage(result),
    [result],
  );
  const activeMessage =
    messageView === "simple" ? simpleMessage : breakdownMessage;

  const validationMessage = useMemo(() => {
    if (result.advertisingBudget < adsPricingConfig.minimumAdBudget) {
      return `Ad budget is below the current minimum of ${formatNaira(
        adsPricingConfig.minimumAdBudget,
      )}.`;
    }

    return "";
  }, [result.advertisingBudget]);

  const updateCustomInput = (field, value) => {
    setCustomInputs((current) => ({ ...current, [field]: value }));
  };

  const copyMessage = async (message, key) => {
    await navigator.clipboard.writeText(message);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? "" : current));
    }, 1600);
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.topBar}>
          <div>
            <span className={styles.eyebrow}>Internal CSR pricing tool</span>
            <h1>TikTok Ads Pricing Calculator</h1>
          </div>
          <div className={styles.topTotal}>
            <span>Total</span>
            <strong>{formatCompactNaira(result.total)}</strong>
          </div>
        </header>

        <section className={styles.appSurface}>
          <div className={styles.leftPane}>
            <section className={styles.decisionPanel}>
              <p className={styles.stepLabel}>
                1. What does the customer need?
              </p>
              <div className={styles.pathGrid}>
                <button
                  className={mode === "recommend" ? styles.activePath : ""}
                  onClick={() => selectMode("recommend")}
                  type="button"
                >
                  <span>Recommended options</span>
                  <strong>
                    Customer is not sure what budget to start with
                  </strong>
                </button>
                <button
                  className={mode === "custom" ? styles.activePath : ""}
                  onClick={() => selectMode("custom")}
                  type="button"
                >
                  <span>Custom plan</span>
                  <strong>Customer already has a budget or duration</strong>
                </button>
              </div>
            </section>

            {mode === "recommend" ? (
              <section className={styles.recommendArea}>
                <div className={styles.sectionHeader}>
                  <p className={styles.stepLabel}>2. Select a recommendation</p>
                  <span>{activePlan.duration} days selected</span>
                </div>

                <div className={styles.planList}>
                  {recommendedPlans.map((plan, index) => (
                    <button
                      className={
                        selectedPlanKey === plan.key ? styles.activePlan : ""
                      }
                      key={plan.key}
                      onClick={() => setSelectedPlanKey(plan.key)}
                      type="button"
                    >
                      <small>{String(index + 1).padStart(2, "0")}</small>
                      <strong>{formatNaira(plan.totalPrice + setupFee)}</strong>
                      <span>{plan.duration} days</span>
                      <em>{creativeAllowanceText(plan.creativeLimit)}</em>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className={styles.customArea}>
                <div className={styles.sectionHeader}>
                  <p className={styles.stepLabel}>2. Enter campaign details</p>
                  <span>Updates instantly</span>
                </div>

                <div className={styles.primaryInputs}>
                  <label>
                    <span>Advertising budget</span>
                    <input
                      min="0"
                      type="number"
                      value={customInputs.advertisingBudget}
                      onChange={(event) =>
                        updateCustomInput(
                          "advertisingBudget",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <label>
                    <span>Number of days</span>
                    <input
                      min="1"
                      type="number"
                      value={customInputs.duration}
                      onChange={(event) =>
                        updateCustomInput("duration", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className={styles.secondaryInputs}>
                  <label>
                    <span>Videos customer wants to use</span>
                    <input
                      min="0"
                      type="number"
                      value={customInputs.requestedCreatives}
                      onChange={(event) =>
                        updateCustomInput(
                          "requestedCreatives",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <label>
                    <span>Videos allowed without extra fee</span>
                    <input
                      min="0"
                      type="number"
                      value={customInputs.creativeLimit}
                      onChange={(event) =>
                        updateCustomInput("creativeLimit", event.target.value)
                      }
                    />
                  </label>
                </div>

                {validationMessage && (
                  <p className={styles.warningText}>{validationMessage}</p>
                )}

                <details className={styles.advancedPanel}>
                  <summary>Adjust manually</summary>
                  <div className={styles.secondaryInputs}>
                    <label>
                      <span>Override ad budget</span>
                      <input
                        min="0"
                        placeholder="Leave blank"
                        type="number"
                        value={customInputs.overrideAdvertisingBudget}
                        onChange={(event) =>
                          updateCustomInput(
                            "overrideAdvertisingBudget",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Override days</span>
                      <input
                        min="1"
                        placeholder="Leave blank"
                        type="number"
                        value={customInputs.overrideDuration}
                        onChange={(event) =>
                          updateCustomInput(
                            "overrideDuration",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Override videos allowed</span>
                      <input
                        min="0"
                        placeholder="Leave blank"
                        type="number"
                        value={customInputs.overrideCreativeLimit}
                        onChange={(event) =>
                          updateCustomInput(
                            "overrideCreativeLimit",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Override service fee</span>
                      <input
                        min="0"
                        placeholder="Leave blank"
                        type="number"
                        value={customInputs.overrideManagementFee}
                        onChange={(event) =>
                          updateCustomInput(
                            "overrideManagementFee",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                </details>
              </section>
            )}

            <section className={styles.addOnsPanel}>
              <div>
                <p className={styles.stepLabel}>3. Add-ons</p>
                <span>Only select what applies</span>
              </div>
              <div className={styles.addOnRows}>
                <label>
                  <input
                    checked={customInputs.needsScriptSupport}
                    type="checkbox"
                    onChange={(event) =>
                      updateCustomInput(
                        "needsScriptSupport",
                        event.target.checked,
                      )
                    }
                  />
                  <span>CONTENT SCRIPT</span>
                  <strong>
                    {formatNaira(adsPricingConfig.scriptSupportPrice)}
                  </strong>
                </label>
                <label>
                  <input
                    checked={needsSetup}
                    disabled={!tikTokSetupFee}
                    type="checkbox"
                    onChange={(event) => setNeedsSetup(event.target.checked)}
                  />
                  <span>{setupAddonLabel}</span>
                  <strong>
                    {tikTokSetupFee ? formatNaira(tikTokSetupFee) : "Not set"}
                  </strong>
                </label>
              </div>
            </section>
          </div>

          <aside className={styles.rightPane}>
            <section className={styles.messagePanel}>
              <div className={styles.messageHead}>
                <div>
                  <span className={styles.eyebrow}>Customer message</span>
                  <h2>Copy and send</h2>
                </div>
                <div className={styles.messageSwitch}>
                  <button
                    className={
                      messageView === "simple" ? styles.activeMessage : ""
                    }
                    onClick={() => setMessageView("simple")}
                    type="button"
                  >
                    Simple
                  </button>
                  <button
                    className={
                      messageView === "breakdown" ? styles.activeMessage : ""
                    }
                    onClick={() => setMessageView("breakdown")}
                    type="button"
                  >
                    Breakdown
                  </button>
                </div>
              </div>

              <CopyBox
                copied={copiedKey === messageView}
                label={`Copy ${messageView} message`}
                onCopy={() => copyMessage(activeMessage, messageView)}
                text={activeMessage}
              />
            </section>
          </aside>
        </section>

        <section className={styles.guidePanel}>
          <div>
            <span className={styles.eyebrow}>Customer guide</span>
            <h2>Recommended plan explanation</h2>
          </div>
          <CopyBox
            copied={copiedKey === "guide"}
            label="Copy recommendation guide"
            onCopy={() => copyMessage(recommendationGuideText, "guide")}
            text={recommendationGuideText}
          />
        </section>
      </section>
    </main>
  );
}

function CopyBox({ copied, label, onCopy, text }) {
  return (
    <div className={styles.copyBox}>
      <button aria-label={label} onClick={onCopy} type="button">
        {copied ? (
          <FiCheck aria-hidden="true" />
        ) : (
          <FiCopy aria-hidden="true" />
        )}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <pre>{text}</pre>
    </div>
  );
}
