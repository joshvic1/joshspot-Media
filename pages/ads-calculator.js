import { useMemo, useState } from "react";
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

export default function AdsCalculator() {
  const [mode, setMode] = useState("recommend");
  const [activeTab, setActiveTab] = useState("recommendation");
  const [selectedPlanKey, setSelectedPlanKey] = useState(
    recommendedPlans[1]?.key || recommendedPlans[0]?.key,
  );
  const [needsSetup, setNeedsSetup] = useState(false);
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

  const result = useMemo(() => {
    const setupFee = needsSetup ? tikTokSetupFee : 0;

    if (mode === "recommend") {
      return calculateTotal({
        advertisingBudget: activePlan.advertisingBudget,
        duration: activePlan.duration,
        creativeLimit: activePlan.creativeLimit,
        requestedCreatives: activePlan.creativeLimit,
        needsScriptSupport: false,
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

  const copyMessage = async (message, label) => {
    await navigator.clipboard.writeText(message);
    alert(`${label} copied`);
  };

  const openTab = (tab) => {
    setActiveTab(tab);

    if (tab === "recommendation") {
      setMode("recommend");
    }

    if (tab === "budget") {
      setMode("custom");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <span className={styles.badge}>Internal CSR Tool</span>
            <h1>Ads price calculator</h1>
            <p>Choose a recommended plan, or enter the customer’s exact budget.</p>
          </div>
          <div className={styles.headerPrice}>
            <span>Total customer pays</span>
            <strong>{formatCompactNaira(result.total)}</strong>
          </div>
        </header>

        <section className={styles.workspace}>
          <div className={styles.controlPanel}>
            <nav className={styles.tabBar} aria-label="Calculator sections">
              <button
                className={
                  activeTab === "recommendation" ? styles.activeTab : ""
                }
                onClick={() => openTab("recommendation")}
                type="button"
              >
                Recommendation
              </button>
              <button
                className={activeTab === "budget" ? styles.activeTab : ""}
                onClick={() => openTab("budget")}
                type="button"
              >
                Budget
              </button>
              <button
                className={activeTab === "messages" ? styles.activeTab : ""}
                onClick={() => setActiveTab("messages")}
                type="button"
              >
                Copy text
              </button>
            </nav>

            {activeTab === "recommendation" && (
              <>
                <section className={styles.infoCard}>
                  <h2>For the ads</h2>
                  <p>
                    How much you spend on your ads depends on your budget and
                    how long you want to run them for. If you're not sure how
                    much to start with, you can choose from any of our
                    recommended plans below:
                  </p>
                  <div className={styles.recommendationTextPlans}>
                    <p>
                      <strong>7 days – ₦60,000</strong>
                      <span>1 video content</span>
                    </p>
                    <p>
                      <strong>10 days – ₦150,000</strong>
                      <span>Up to 3 video contents</span>
                    </p>
                    <p>
                      <strong>15 days – ₦285,000</strong>
                      <span>Up to 6 video contents</span>
                    </p>
                    <p>
                      <strong>30 days – ₦450,000</strong>
                      <span>Up to 10 video contents</span>
                    </p>
                  </div>
                  <h3>Note:</h3>
                  <ol>
                    <li>
                      These are only our recommended plans. You can also
                      customize how much you want to spend on ads and how many
                      days you want us to run them for.
                    </li>
                    <li>
                      There's no best or worst amount to spend on ads. However,
                      a higher ad budget gives us more room to reach more
                      people and optimize your ads.
                    </li>
                  </ol>
                  <p>Let us know which of the options you'd like to go for.</p>
                </section>

                <section className={styles.card}>
                  <div className={styles.cardTitle}>
                    <span>Plans</span>
                    <h2>Select one</h2>
                  </div>

                  <div className={styles.planGrid}>
                    {recommendedPlans.map((plan) => (
                      <button
                        className={
                          selectedPlanKey === plan.key ? styles.activePlan : ""
                        }
                        key={plan.key}
                        onClick={() => {
                          setMode("recommend");
                          setSelectedPlanKey(plan.key);
                        }}
                        type="button"
                      >
                        <strong>{formatNaira(plan.totalPrice)}</strong>
                        <span>{plan.duration} days</span>
                        <small>{creativeAllowanceText(plan.creativeLimit)}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeTab === "budget" && (
              <>
                <section className={styles.card}>
                  <div className={styles.cardTitle}>
                    <span>Custom</span>
                    <h2>Enter customer budget</h2>
                  </div>

                  <div className={styles.inputGrid}>
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
                      <span>Campaign days</span>
                      <input
                        min="1"
                        type="number"
                        value={customInputs.duration}
                        onChange={(event) =>
                          updateCustomInput("duration", event.target.value)
                        }
                      />
                    </label>
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
                </section>

                <section className={styles.setupCard}>
                  <label className={styles.switchRow}>
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
                    <span>
                      Add Creative/Script Support (
                      {formatNaira(adsPricingConfig.scriptSupportPrice)})
                    </span>
                  </label>
                  <label className={styles.switchRow}>
                    <input
                      checked={needsSetup}
                      disabled={!tikTokSetupFee}
                      type="checkbox"
                      onChange={(event) => setNeedsSetup(event.target.checked)}
                    />
                    <span>
                      Add TikTok Ads Manager setup
                      {tikTokSetupFee
                        ? ` (${formatNaira(tikTokSetupFee)})`
                        : " (add setup price in services config)"}
                    </span>
                  </label>
                </section>

                <details className={styles.overrideCard}>
                  <summary>Manual override</summary>
                  <div className={styles.inputGrid}>
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
              </>
            )}

            {activeTab === "messages" && (
              <section className={styles.messages}>
                <MessagePanel
                  buttonLabel="Copy simple message"
                  message={simpleMessage}
                  onCopy={() => copyMessage(simpleMessage, "Simple message")}
                  title="Send this first"
                />
                <MessagePanel
                  buttonLabel="Copy breakdown"
                  message={breakdownMessage}
                  onCopy={() => copyMessage(breakdownMessage, "Breakdown")}
                  title="Breakdown if customer asks"
                />
              </section>
            )}
          </div>

          <aside className={styles.resultPanel}>
            <span className={styles.resultEyebrow}>Quote</span>
            <h2>Price to quote</h2>
            <strong className={styles.total}>{formatNaira(result.total)}</strong>

            {validationMessage && (
              <p className={styles.warningText}>{validationMessage}</p>
            )}

            <div className={styles.breakdownList}>
              <p>
                <span>Advertising budget</span>
                <strong>{formatNaira(result.advertisingBudget)}</strong>
              </p>
              <p>
                <span>Our service fee</span>
                <strong>{formatNaira(result.managementFee)}</strong>
              </p>
              <p>
                <span>Duration</span>
                <strong>{result.duration} days</strong>
              </p>
              <p>
                <span>Videos allowed</span>
                <strong>{creativeAllowanceText(result.creativeLimit)}</strong>
              </p>
              <p>
                <span>Add-ons</span>
                <strong>{formatNaira(result.addOnsTotal)}</strong>
              </p>
              <p>
                <span>Internal ratio</span>
                <strong>{result.managementRatio.toFixed(1)}%</strong>
              </p>
            </div>

            <p className={styles.noteText}>
              Video allowance means finished videos the client provides for us to
              test. It does not include video production, editing or script writing
              unless Creative/Script Support is selected.
            </p>
          </aside>
        </section>
      </section>
    </main>
  );
}

function MessagePanel({ buttonLabel, message, onCopy, title }) {
  return (
    <article className={styles.messageCard}>
      <div>
        <h2>{title}</h2>
        <button onClick={onCopy} type="button">
          {buttonLabel}
        </button>
      </div>
      <pre>{message}</pre>
    </article>
  );
}
