import { useMemo, useState } from "react";
import {
  adsPricingConfig,
  calculateTotal,
  formatCompactNaira,
  formatNaira,
  generateBreakdownMessage,
  generateSimpleMessage,
} from "../config/adsPricingConfig.mjs";
import styles from "../styles/AdsCalculator.module.css";

const enabledPresets = adsPricingConfig.recommendationPresets.filter(
  (preset) => preset.enabled,
);

const customerTypes = [
  {
    label: "Low-budget / Just testing",
    hint: "For customers who only want to test TikTok ads first.",
    presetKey: "quick-test",
  },
  {
    label: "Normal first-time advertiser",
    hint: "Best default option for most new advertisers.",
    presetKey: "starter",
  },
  {
    label: "Serious business / Stronger campaign",
    hint: "For businesses that want more room to test and optimize.",
    presetKey: "growth",
  },
  {
    label: "High-budget advertiser",
    hint: "For customers ready for a more serious campaign.",
    presetKey: "scale",
  },
];

const getPreset = (key) => enabledPresets.find((preset) => preset.key === key);

export default function AdsCalculator() {
  const [mode, setMode] = useState("recommend");
  const [customerType, setCustomerType] = useState(customerTypes[1].label);
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

  const selectedCustomerType = useMemo(
    () => customerTypes.find((type) => type.label === customerType) || customerTypes[1],
    [customerType],
  );

  const activePreset = useMemo(
    () => getPreset(selectedCustomerType.presetKey) || enabledPresets[0],
    [selectedCustomerType],
  );

  const result = useMemo(() => {
    if (mode === "recommend") {
      return calculateTotal({
        advertisingBudget: activePreset.advertisingBudget,
        duration: activePreset.duration,
        creativeLimit: activePreset.creativeLimit,
        requestedCreatives: activePreset.creativeLimit,
        needsScriptSupport: false,
        overrideAdvertisingBudget: customInputs.overrideAdvertisingBudget,
        overrideDuration: customInputs.overrideDuration,
        overrideCreativeLimit: customInputs.overrideCreativeLimit,
        overrideManagementFee:
          customInputs.overrideManagementFee || activePreset.managementFee,
      });
    }

    return calculateTotal(customInputs);
  }, [activePreset, customInputs, mode]);

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

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <span className={styles.badge}>Internal CSR Tool</span>
            <h1>Ads price calculator</h1>
            <p>Pick a customer situation, confirm the price, copy the message.</p>
          </div>
          <div className={styles.headerPrice}>
            <span>Total to send</span>
            <strong>{formatCompactNaira(result.total)}</strong>
          </div>
        </header>

        <section className={styles.workspace}>
          <div className={styles.controlPanel}>
            <div className={styles.modeCards}>
              <button
                className={mode === "recommend" ? styles.activeMode : ""}
                onClick={() => setMode("recommend")}
                type="button"
              >
                <strong>Customer needs recommendation</strong>
                <span>Use this when they ask how much they should start with.</span>
              </button>
              <button
                className={mode === "custom" ? styles.activeMode : ""}
                onClick={() => setMode("custom")}
                type="button"
              >
                <strong>Customer has a budget</strong>
                <span>Use this when they already know amount or duration.</span>
              </button>
            </div>

            {mode === "recommend" ? (
              <section className={styles.card}>
                <div className={styles.cardTitle}>
                  <span>Step 1</span>
                  <h2>Choose the closest customer type</h2>
                </div>

                <div className={styles.choiceList}>
                  {customerTypes.map((type) => (
                    <button
                      className={customerType === type.label ? styles.activeChoice : ""}
                      key={type.label}
                      onClick={() => setCustomerType(type.label)}
                      type="button"
                    >
                      <strong>{type.label}</strong>
                      <span>{type.hint}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <section className={styles.card}>
                <div className={styles.cardTitle}>
                  <span>Step 1</span>
                  <h2>Enter what the customer told you</h2>
                </div>

                <div className={styles.inputGrid}>
                  <label>
                    <span>Advertising budget</span>
                    <input
                      min="0"
                      type="number"
                      value={customInputs.advertisingBudget}
                      onChange={(event) =>
                        updateCustomInput("advertisingBudget", event.target.value)
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
                    <span>Videos customer wants</span>
                    <input
                      min="0"
                      type="number"
                      value={customInputs.requestedCreatives}
                      onChange={(event) =>
                        updateCustomInput("requestedCreatives", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>Videos included</span>
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

                <label className={styles.switchRow}>
                  <input
                    checked={customInputs.needsScriptSupport}
                    type="checkbox"
                    onChange={(event) =>
                      updateCustomInput("needsScriptSupport", event.target.checked)
                    }
                  />
                  <span>Customer also needs Creative/Script Support</span>
                </label>
              </section>
            )}

            <details className={styles.overrideCard}>
              <summary>Fine tune manually, only when needed</summary>
              <div className={styles.inputGrid}>
                <label>
                  <span>Override ad budget</span>
                  <input
                    min="0"
                    placeholder="Leave blank"
                    type="number"
                    value={customInputs.overrideAdvertisingBudget}
                    onChange={(event) =>
                      updateCustomInput("overrideAdvertisingBudget", event.target.value)
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
                      updateCustomInput("overrideDuration", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Override videos included</span>
                  <input
                    min="0"
                    placeholder="Leave blank"
                    type="number"
                    value={customInputs.overrideCreativeLimit}
                    onChange={(event) =>
                      updateCustomInput("overrideCreativeLimit", event.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Override management fee</span>
                  <input
                    min="0"
                    placeholder="Leave blank"
                    type="number"
                    value={customInputs.overrideManagementFee}
                    onChange={(event) =>
                      updateCustomInput("overrideManagementFee", event.target.value)
                    }
                  />
                </label>
              </div>
            </details>
          </div>

          <aside className={styles.resultPanel}>
            <span className={styles.resultEyebrow}>Step 2</span>
            <h2>Price to quote</h2>
            <strong className={styles.total}>{formatNaira(result.total)}</strong>

            {validationMessage && (
              <p className={styles.warningText}>{validationMessage}</p>
            )}

            <div className={styles.breakdownList}>
              <p>
                <span>Ad budget</span>
                <strong>{formatNaira(result.advertisingBudget)}</strong>
              </p>
              <p>
                <span>Management</span>
                <strong>{formatNaira(result.managementFee)}</strong>
              </p>
              <p>
                <span>Duration</span>
                <strong>{result.duration} days</strong>
              </p>
              <p>
                <span>Videos allowed</span>
                <strong>{result.creativeLimit}</strong>
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
          </aside>
        </section>

        <section className={styles.messages}>
          <MessagePanel
            buttonLabel="Copy message to send first"
            message={simpleMessage}
            onCopy={() => copyMessage(simpleMessage, "Simple message")}
            title="Step 3: Send this first"
          />
          <MessagePanel
            buttonLabel="Copy breakdown if asked"
            message={breakdownMessage}
            onCopy={() => copyMessage(breakdownMessage, "Breakdown")}
            title="Breakdown"
          />
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
