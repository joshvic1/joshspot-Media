import { useMemo, useState } from "react";
import {
  adsPricingConfig,
  calculateTotal,
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
    presetKey: "quick-test",
    higherPresetKey: "starter",
  },
  {
    label: "Normal first-time advertiser",
    presetKey: "starter",
    higherPresetKey: "growth",
  },
  {
    label: "Serious business / Wants stronger campaign",
    presetKey: "growth",
    higherPresetKey: "scale",
  },
  {
    label: "High-budget advertiser",
    presetKey: "scale",
    higherPresetKey: "high-budget",
  },
];

const getPreset = (key) => enabledPresets.find((preset) => preset.key === key);

export default function AdsCalculator() {
  const [mode, setMode] = useState("recommend");
  const [customerType, setCustomerType] = useState(customerTypes[1].label);
  const [selectedPresetKey, setSelectedPresetKey] = useState("starter");
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

  const activePreset = useMemo(() => {
    const typePreset = customerTypes.find((type) => type.label === customerType);
    return getPreset(typePreset?.presetKey) || getPreset(selectedPresetKey) || enabledPresets[0];
  }, [customerType, selectedPresetKey]);

  const higherPreset = useMemo(() => {
    const typePreset = customerTypes.find((type) => type.label === customerType);
    return getPreset(typePreset?.higherPresetKey);
  }, [customerType]);

  const result = useMemo(() => {
    const source =
      mode === "recommend"
        ? {
            advertisingBudget: activePreset.advertisingBudget,
            duration: activePreset.duration,
            creativeLimit: activePreset.creativeLimit,
            requestedCreatives: activePreset.creativeLimit,
            needsScriptSupport: false,
            overrideAdvertisingBudget: customInputs.overrideAdvertisingBudget,
            overrideDuration: customInputs.overrideDuration,
            overrideCreativeLimit: customInputs.overrideCreativeLimit,
            overrideManagementFee: customInputs.overrideManagementFee,
          }
        : customInputs;

    return calculateTotal(source);
  }, [activePreset, customInputs, mode]);

  const validationMessages = useMemo(() => {
    const messages = [];

    if (result.advertisingBudget < adsPricingConfig.minimumAdBudget) {
      messages.push(
        `Ad budget is below the current minimum of ${formatNaira(
          adsPricingConfig.minimumAdBudget,
        )}.`,
      );
    }

    if (result.duration <= 0) {
      messages.push("Campaign duration must be at least 1 day.");
    }

    return messages;
  }, [result]);

  const simpleMessage = useMemo(() => generateSimpleMessage(result), [result]);
  const breakdownMessage = useMemo(
    () => generateBreakdownMessage(result),
    [result],
  );

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
          <span className={styles.badge}>Internal CSR Tool</span>
          <h1>TikTok Ads Pricing Calculator</h1>
          <p>
            Recommend a plan, calculate custom pricing, and copy simple client
            messages without exposing internal math too early.
          </p>
        </header>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>1</span>
              <div>
                <h2>Calculator Mode</h2>
                <p>Choose how the customer is asking.</p>
              </div>
            </div>

            <div className={styles.segmented}>
              <button
                className={mode === "recommend" ? styles.activeSegment : ""}
                onClick={() => setMode("recommend")}
                type="button"
              >
                Recommend a Plan
              </button>
              <button
                className={mode === "custom" ? styles.activeSegment : ""}
                onClick={() => setMode("custom")}
                type="button"
              >
                Custom Pricing
              </button>
            </div>

            {mode === "recommend" ? (
              <div className={styles.formGroup}>
                <label>
                  <span>Customer type</span>
                  <select
                    value={customerType}
                    onChange={(event) => {
                      const nextType = customerTypes.find(
                        (type) => type.label === event.target.value,
                      );
                      setCustomerType(event.target.value);
                      setSelectedPresetKey(nextType?.presetKey || "starter");
                    }}
                  >
                    {customerTypes.map((type) => (
                      <option key={type.label}>{type.label}</option>
                    ))}
                  </select>
                </label>

                <div className={styles.recommendedCard}>
                  <span>Recommended</span>
                  <h3>{formatNaira(activePreset.totalPrice)} plan</h3>
                  <p>{activePreset.name}</p>
                </div>

                {higherPreset && (
                  <div className={styles.higherOption}>
                    Higher option: <strong>{formatNaira(higherPreset.totalPrice)}</strong>{" "}
                    for {higherPreset.duration} days
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.formGrid}>
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
                  <span>Video creatives customer wants</span>
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
                  <span>Creative allowance</span>
                  <input
                    min="0"
                    type="number"
                    value={customInputs.creativeLimit}
                    onChange={(event) =>
                      updateCustomInput("creativeLimit", event.target.value)
                    }
                  />
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    checked={customInputs.needsScriptSupport}
                    type="checkbox"
                    onChange={(event) =>
                      updateCustomInput("needsScriptSupport", event.target.checked)
                    }
                  />
                  <span>Creative/Script Support needed</span>
                </label>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>2</span>
              <div>
                <h2>Admin Override</h2>
                <p>Optional internal adjustments.</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label>
                <span>Override advertising budget</span>
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
                <span>Override duration</span>
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
                <span>Override creative limit</span>
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
          </div>
        </section>

        {validationMessages.length > 0 && (
          <div className={styles.warningBox}>
            {validationMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <section className={styles.resultGrid}>
          <div className={styles.resultCard}>
            <span>Advertising Budget</span>
            <strong>{formatNaira(result.advertisingBudget)}</strong>
          </div>
          <div className={styles.resultCard}>
            <span>Management Fee</span>
            <strong>{formatNaira(result.managementFee)}</strong>
            <small>Internal ratio: {result.managementRatio.toFixed(1)}%</small>
          </div>
          <div className={styles.resultCard}>
            <span>Add-ons</span>
            <strong>{formatNaira(result.addOnsTotal)}</strong>
          </div>
          <div className={styles.resultCard}>
            <span>Total Amount</span>
            <strong>{formatNaira(result.total)}</strong>
          </div>
        </section>

        <section className={styles.messageGrid}>
          <MessagePanel
            buttonLabel="Copy Simple Message"
            message={simpleMessage}
            onCopy={() => copyMessage(simpleMessage, "Simple message")}
            title="Simple Customer Message"
          />
          <MessagePanel
            buttonLabel="Copy Breakdown"
            message={breakdownMessage}
            onCopy={() => copyMessage(breakdownMessage, "Breakdown")}
            title="Detailed Breakdown"
          />
        </section>
      </section>
    </main>
  );
}

function MessagePanel({ buttonLabel, message, onCopy, title }) {
  return (
    <article className={styles.messagePanel}>
      <div className={styles.messageTop}>
        <h2>{title}</h2>
        <button onClick={onCopy} type="button">
          {buttonLabel}
        </button>
      </div>
      <pre>{message}</pre>
    </article>
  );
}
