import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCopy,
  FiMinus,
  FiPlus,
  FiChevronDown,
} from "react-icons/fi";
import {
  adsPricingConfig as config,
  calculateTotal,
  formatNaira,
  generateSimpleMessage,
  generateBreakdownMessage,
  generateRecommendationGuide,
  getRecommendedPlans,
} from "../config/adsPricingConfig.mjs";
import { services } from "../config/services";
import QuickReplies from "../components/QuickReplies";
import CalculatorAccess from "../components/crm/CalculatorAccess";
import styles from "../styles/AdsCalculator.module.css";

const plans = getRecommendedPlans();
const setupPrice = services
  .find((service) => service.id === 3)
  ?.options?.find((option) => option.label === "TikTok only")?.price;
const initialCustom = {
  advertisingBudget: "35000",
  dailyAdvertisingBudget: "5000",
  budgetType: "total",
  duration: "7",
  overrideAdvertisingBudget: "",
  overrideDuration: "",
  overrideCreativeLimit: "",
  overrideManagementFee: "",
};
const headings = {
  pricing: [
    "Start with the right plan.",
    "Does the customer want a ready-made plan or their own budget?",
  ],
  plan: [
    "Choose a recommended plan.",
    "Suggested budgets and durations, priced with our current rules.",
  ],
  budget: [
    "What’s their ad budget?",
    "This is money spent on advertising, separate from our service fee.",
  ],
  duration: [
    "How long should the ads run?",
    "Choose the number of days we’ll manage the campaign.",
  ],
  videos: [
    "How should the videos run?",
    "Test them together, or give each video its own advertising budget.",
  ],
  extras: [
    "Anything else they need?",
    "Only add the services this customer needs.",
  ],
  review: [
    "Your quote is ready.",
    "Check the details, then copy a message for the customer.",
  ],
};

export default function AdsCalculatorPage() {
  return <CalculatorAccess><AdsCalculator /></CalculatorAccess>;
}
function AdsCalculator() {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [planKey, setPlanKey] = useState(plans[0].key);
  const [custom, setCustom] = useState(initialCustom);
  const [creativeMode, setCreativeMode] = useState("testing");
  const [count, setCount] = useState(2);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsScriptSupport, setScript] = useState(false);
  const [step, setStep] = useState("pricing");
  const [messageView, setMessageView] = useState("simple");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [suggestIndividual, setSuggestIndividual] = useState(false);
  const heading = useRef(null);
  const steps =
    mode !== "custom"
      ? ["pricing", "plan", "videos", "extras", "review"]
      : ["pricing", "budget", "videos", "extras", "review"];
  const stepIndex = steps.indexOf(step);
  const result = useMemo(
    () =>
      !mode
        ? { valid: false, errors: {} }
        : calculateTotal({
            ...custom,
            advertisingBudget:
              custom.budgetType === "daily"
                ? custom.dailyAdvertisingBudget
                : custom.advertisingBudget,
            mode,
            planKey,
            creativeMode,
            requestedCreatives: count,
            needsScriptSupport,
            setupFee: needsSetup ? setupPrice : 0,
          }),
    [
      custom,
      mode,
      planKey,
      creativeMode,
      count,
      needsScriptSupport,
      needsSetup,
    ],
  );
  const message =
    messageView === "simple"
      ? generateSimpleMessage(result)
      : generateBreakdownMessage(result);
  const guide = generateRecommendationGuide({
    setupFee: needsSetup ? setupPrice : 0,
    needsScriptSupport,
  });
  const update = (field, value) => {
    setCustom((previous) => ({ ...previous, [field]: value }));
    setCopyFeedback("");
  };
  function go(next) {
    setStep(next);
    setCopyFeedback("");
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
  }
  function chooseMode(value) {
    setMode(value);
    setStep(value === "recommend" ? "plan" : "budget");
    setCopyFeedback("");
  }
  function chooseCreative(value) {
    setCreativeMode(value);
    setSuggestIndividual(false);
    setCopyFeedback("");
    if (value === "testing") {
      setCount((current) => Math.min(current, config.creatives.testingMax));
      setCustom((previous) => ({ ...previous, overrideCreativeLimit: "" }));
    }
  }
  function increment() {
    if (creativeMode === "testing" && count >= config.creatives.testingMax) {
      setSuggestIndividual(true);
      return;
    }
    setCount((value) => Math.min(config.limits.maximumCreatives, value + 1));
    setCopyFeedback("");
  }
  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label + " copied. Ready to paste.");
    } catch {
      setCopyFeedback(
        "Copy is unavailable here. Select the message below and copy it manually.",
      );
    }
  }
  const currentError =
    step === "budget"
      ? [result.errors.budget, result.errors.duration].filter(Boolean).join(" ")
      : step === "duration"
        ? result.errors.duration
        : step === "videos"
          ? result.errors.creatives
          : step === "extras"
            ? Object.values(result.errors).join(" ")
            : "";
  const next = steps[stepIndex + 1];
  const changeCopy = () => setCopyFeedback("");
  return (
    <div className={styles.page}>
      <Head>
        <title>Ads pricing assistant | Joshspot Media</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
        <button className={styles.arrowBack} aria-label="Back to previous page or CRM" onClick={() => window.history.length > 1 ? router.back() : router.push("/crm-dashboard")}><FiArrowLeft /></button>
        <Link href="/" className={styles.brand}>
          Joshspot<span>Media</span>
        </Link>
        </div>
        <button
          className={styles.quickTrigger}
          onClick={() => setQuickRepliesOpen(true)}
        >
          Quick Replies
        </button>
      </header>
      {quickRepliesOpen && (
        <QuickReplies onClose={() => setQuickRepliesOpen(false)} />
      )}
      <main className={styles.workspace}>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.eyebrow}>TIKTOK ADS · PRICING ASSISTANT</p>
          </div>
          <span className={styles.live}>
            <i /> Live pricing
          </span>
        </div>
        <nav aria-label="Quote steps" className={styles.steps}>
          {steps.map((item, index) => (
            <button
              key={item}
              disabled={!mode && item !== "pricing"}
              aria-current={step === item ? "step" : undefined}
              onClick={() => go(item)}
              className={step === item ? styles.currentStep : ""}
            >
              <span>{index < stepIndex ? <FiCheck /> : index + 1}</span>
              <small>
                {
                  {
                    pricing: "Start",
                    plan: "Plan",
                    budget: "Budget",
                    duration: "Days",
                    videos: "Videos",
                    extras: "Extras",
                    review: "Review",
                  }[item]
                }
              </small>
            </button>
          ))}
        </nav>
        <div className={styles.layout}>
          <section className={styles.flow}>
            <div className={styles.progressTrack}>
              <div
                style={{ width: ((stepIndex + 1) / steps.length) * 100 + "%" }}
              />
            </div>
            <div
              key={step}
              className={`${styles.stage} ${step === "pricing" ? styles.startStage : ""}`}
            >
              <p className={styles.stepNumber}>
                STEP {String(stepIndex + 1).padStart(2, "0")} /{" "}
                {String(steps.length).padStart(2, "0")}
              </p>
              <h2 tabIndex={-1} ref={heading}>
                {!result.valid && step === "review"
                  ? "Let’s check your quote."
                  : headings[step][0]}
              </h2>
              <p className={styles.intro}>{headings[step][1]}</p>
              {step === "pricing" && (
                <div className={styles.choices}>
                  <Choice
                    selected={mode === "recommend"}
                    onClick={() => chooseMode("recommend")}
                    title="Recommended plan"
                    description="Start with one of four suggested plans."
                    detail="7, 10, 15 or 30 days"
                  />
                  <Choice
                    selected={mode === "custom"}
                    onClick={() => chooseMode("custom")}
                    title="Custom plan"
                    description="They choose the budget. We work out the fee."
                    detail="Flexible budget & duration"
                  />
                </div>
              )}
              {step === "plan" && (
                <>
                  <div className={styles.plans}>
                    {plans.map((item) => (
                      <button
                        key={item.key}
                        aria-pressed={planKey === item.key}
                        className={
                          planKey === item.key ? styles.selectedPlan : ""
                        }
                        onClick={() => {
                          setPlanKey(item.key);
                          changeCopy();
                        }}
                      >
                        <span className={styles.planDays}>
                          {item.duration} <small>days</small>
                          <span className={styles.radio}>
                            {planKey === item.key && <FiCheck />}
                          </span>
                        </span>
                        <strong>{formatNaira(item.totalPrice)}</strong>
                        <span className={styles.planLine}>
                          {formatNaira(item.advertisingBudget)} ad budget
                        </span>
                        <span className={styles.planLine}>
                          {formatNaira(item.managementFee)} management
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    className={styles.textAction}
                    disabled={!result.valid}
                    onClick={() => go("review")}
                  >
                    Use current selections & view message <FiArrowRight />
                  </button>
                </>
              )}
              {step === "budget" && (
                <>
                  <div
                    className={styles.segment}
                    role="group"
                    aria-label="Budget entry type"
                  >
                    {[
                      ["total", "Total ad budget"],
                      ["daily", "Daily ad budget"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        aria-pressed={custom.budgetType === value}
                        onClick={() => update("budgetType", value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.budgetDays}>
                    <label className={styles.bigField}>
                      <span>
                        {custom.budgetType === "daily"
                          ? "Daily advertising budget"
                          : "Total advertising budget"}
                        {creativeMode === "individual" ? " per video" : ""}
                      </span>
                      <div>
                        <b>₦</b>
                        <input
                          inputMode="decimal"
                          type="number"
                          min=".01"
                          step=".01"
                          max={config.limits.maximumBudget}
                          aria-invalid={!!result.errors.budget}
                          aria-describedby={
                            result.errors.budget ? "step-error" : undefined
                          }
                          value={
                            custom.budgetType === "daily"
                              ? custom.dailyAdvertisingBudget
                              : custom.advertisingBudget
                          }
                          onChange={(event) =>
                            update(
                              custom.budgetType === "daily"
                                ? "dailyAdvertisingBudget"
                                : "advertisingBudget",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </label>
                    <label className={styles.bigField}>
                      <span>Campaign duration</span>
                      <div>
                        <input
                          inputMode="numeric"
                          type="number"
                          min="1"
                          max={config.limits.maximumDuration}
                          step="1"
                          aria-invalid={!!result.errors.duration}
                          aria-describedby={
                            result.errors.duration ? "step-error" : undefined
                          }
                          value={custom.duration}
                          onChange={(event) =>
                            update("duration", event.target.value)
                          }
                        />
                        <b>days</b>
                      </div>
                    </label>
                  </div>
                  <div className={styles.presets} aria-label="Budget shortcuts">
                    {(custom.budgetType === "daily"
                      ? [5000, 10000, 15000, 30000]
                      : [35000, 100000, 150000, 300000]
                    ).map((value) => (
                      <button
                        key={value}
                        onClick={() =>
                          update(
                            custom.budgetType === "daily"
                              ? "dailyAdvertisingBudget"
                              : "advertisingBudget",
                            String(value),
                          )
                        }
                      >
                        {formatNaira(value)}
                        {custom.budgetType === "daily" ? " / day" : ""}
                      </button>
                    ))}
                  </div>
                  <div className={`${styles.presets} ${styles.dayPresets}`}>
                    {config.durationAnchors.map(({ days }) => (
                      <button
                        key={days}
                        aria-pressed={Number(custom.duration) === days}
                        onClick={() => update("duration", String(days))}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                  {result.valid && (
                    <p className={styles.budgetConversion}>
                      {custom.budgetType === "daily" &&
                      !custom.overrideAdvertisingBudget
                        ? formatNaira(Number(custom.dailyAdvertisingBudget)) +
                          " / day × " +
                          result.duration +
                          " days = "
                        : "Campaign ad budget: "}
                      <strong>{formatNaira(result.baseAdBudget)}</strong>
                      {creativeMode === "individual" ? " per video" : ""}
                    </p>
                  )}
                  <p className={styles.helper}>
                    {creativeMode === "individual"
                      ? "Each video gets this campaign budget. The total across all videos updates automatically."
                      : "This is advertising spend only. If videos run individually, each gets its own campaign budget."}
                  </p>
                  {(custom.overrideAdvertisingBudget ||
                    custom.overrideDuration) && (
                    <p className={styles.notice}>
                      Manual budget or duration adjustments are active. The
                      budget adjustment is a campaign total, not a daily amount.
                      <button
                        onClick={() =>
                          setCustom((previous) => ({
                            ...previous,
                            overrideAdvertisingBudget: "",
                            overrideDuration: "",
                          }))
                        }
                      >
                        Clear budget & duration adjustments
                      </button>
                    </p>
                  )}
                </>
              )}
              {step === "videos" && (
                <>
                  <div className={styles.choices}>
                    <Choice
                      selected={creativeMode === "testing"}
                      onClick={() => chooseCreative("testing")}
                      title="Creative testing"
                      description="Test up to 2 videos together"
                    />
                    <Choice
                      selected={creativeMode === "individual"}
                      onClick={() => chooseCreative("individual")}
                      title="Advertise each video separately"
                      description="Each video gets its own advertising budget."
                    />
                  </div>
                  <div className={styles.quantity}>
                    <div>
                      <label id="quantity-label">
                        {creativeMode === "individual"
                          ? "Videos to advertise separately"
                          : "Videos to test"}
                      </label>
                      <small>
                        {creativeMode === "testing"
                          ? "Maximum 2 videos"
                          : "Each video adds its own budget and fee"}
                      </small>
                    </div>
                    <div className={styles.stepper}>
                      <button
                        aria-label="Remove one video"
                        disabled={count <= 1}
                        onClick={() => {
                          setCount((value) => value - 1);
                          changeCopy();
                        }}
                      >
                        <FiMinus />
                      </button>
                      <output aria-labelledby="quantity-label">{count}</output>
                      <button
                        aria-label="Add one video"
                        disabled={count >= config.limits.maximumCreatives}
                        onClick={increment}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                  {suggestIndividual && (
                    <div className={styles.notice} role="status">
                      Need more than 2 videos? Each one will need its own
                      budget.
                      <button
                        onClick={() => {
                          chooseCreative("individual");
                          setCount(3);
                        }}
                      >
                        Switch to 3 individual videos <FiArrowRight />
                      </button>
                    </div>
                  )}
                  {custom.overrideCreativeLimit && mode === "custom" && (
                    <p className={styles.notice}>
                      A manual video count is active.{" "}
                      <button
                        onClick={() => update("overrideCreativeLimit", "")}
                      >
                        Clear adjustment
                      </button>
                    </p>
                  )}
                  {creativeMode === "testing" ? (
                    <p className={styles.helper}>.</p>
                  ) : (
                    result.valid && (
                      <div className={styles.math}>
                        <p>
                          {formatNaira(result.baseAdBudget)} per video{" "}
                          <span>× {result.creativeCount} videos</span>
                        </p>
                        <strong>
                          {formatNaira(result.advertisingBudget)}{" "}
                          <small>total ad budget</small>
                        </strong>
                        <p>
                          Extra creative management{" "}
                          <b>{formatNaira(result.creativeFee)}</b>
                        </p>
                      </div>
                    )
                  )}
                </>
              )}
              {step === "extras" && (
                <>
                  <div className={styles.addons}>
                    <label>
                      <input
                        type="checkbox"
                        checked={needsScriptSupport}
                        onChange={(event) => {
                          setScript(event.target.checked);
                          changeCopy();
                        }}
                      />
                      <span>
                        <strong>Content script</strong>
                        <small>
                          Help with what the customer’s video should say.
                        </small>
                      </span>
                      <b>{formatNaira(config.scriptSupportPrice)}</b>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={needsSetup}
                        disabled={!setupPrice}
                        onChange={(event) => {
                          setNeedsSetup(event.target.checked);
                          changeCopy();
                        }}
                      />
                      <span>
                        <strong>TikTok Ads Manager setup</strong>
                        <small>
                          For customers whose ad account isn’t ready.
                        </small>
                      </span>
                      <b>
                        {setupPrice ? formatNaira(setupPrice) : "Unavailable"}
                      </b>
                    </label>
                  </div>
                  {mode === "custom" && (
                    <details className={styles.details}>
                      <summary>
                        Manual adjustment{" "}
                        <span>
                          Optional <FiChevronDown />
                        </span>
                      </summary>
                      <p className={styles.helper}>
                        Adjust the budget, days, video count or management
                        component. Creative fees and add-ons stay separate.
                        Testing still allows at most 2 videos.
                      </p>
                      <div className={styles.manualGrid}>
                        {[
                          [
                            "overrideAdvertisingBudget",
                            "Budget per video / shared budget",
                            0.01,
                            "decimal",
                          ],
                          ["overrideDuration", "Campaign days", 1, "numeric"],
                          [
                            "overrideCreativeLimit",
                            "Video count",
                            1,
                            "numeric",
                          ],
                          [
                            "overrideManagementFee",
                            "Management before creative fees",
                            config.minimumManagementFee,
                            "decimal",
                          ],
                        ].map(([field, label, min, inputMode]) => (
                          <label key={field}>
                            {label}
                            <input
                              type="number"
                              inputMode={inputMode}
                              min={min}
                              step={inputMode === "numeric" ? "1" : ".01"}
                              placeholder="Automatic"
                              value={custom[field]}
                              onChange={(event) =>
                                update(field, event.target.value)
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <button
                        className={styles.textAction}
                        onClick={() =>
                          setCustom((previous) => ({
                            ...previous,
                            overrideAdvertisingBudget: "",
                            overrideDuration: "",
                            overrideCreativeLimit: "",
                            overrideManagementFee: "",
                          }))
                        }
                      >
                        Clear manual adjustments
                      </button>
                    </details>
                  )}
                </>
              )}
              {currentError && (
                <p id="step-error" role="alert" className={styles.error}>
                  {currentError}
                </p>
              )}
              {step === "review" && (
                <>
                  <div className={styles.mobileSummary}>
                    <Summary result={result} />
                  </div>
                  {result.valid ? (
                    <MessageBox
                      message={message}
                      view={messageView}
                      onView={(value) => {
                        setMessageView(value);
                        changeCopy();
                      }}
                      onCopy={() => copy(message, "Message")}
                    />
                  ) : (
                    <div className={styles.error} role="alert">
                      {Object.values(result.errors).map((error) => (
                        <p key={error}>{error}</p>
                      ))}
                      <button
                        onClick={() =>
                          go(mode === "custom" ? "extras" : "videos")
                        }
                      >
                        Review your inputs
                      </button>
                    </div>
                  )}
                </>
              )}
              {step === "review" && (
                <>
                  <div className={styles.mobileSummary}>
                    <CalculationDetails result={result} />
                  </div>
                  <details className={styles.details}>
                    <summary>
                      Recommended plan guide <FiChevronDown />
                    </summary>
                    <p className={styles.helper}>
                      A separate message for customers who are still choosing.
                      Includes selected optional services; uses standard
                      creative testing.
                    </p>
                    <pre className={styles.message}>{guide}</pre>
                    <button
                      className={styles.secondary}
                      onClick={() => copy(guide, "Plan guide")}
                    >
                      <FiCopy /> Copy plan guide
                    </button>
                  </details>
                </>
              )}
            </div>
            <div className={styles.flowFooter}>
              {stepIndex > 0 ? (
                <button
                  className={styles.arrowBack}
                  aria-label="Previous step"
                  onClick={() => go(steps[stepIndex - 1])}
                >
                  <FiArrowLeft />
                </button>
              ) : (
                null
              )}
              {next && (
                <button
                  className={styles.primary}
                  disabled={!mode || !!currentError}
                  onClick={() => go(next)}
                >
                  {next === "review" ? "Review quote" : "Continue"}{" "}
                  <FiArrowRight />
                </button>
              )}
              {step === "review" && (
                <button className={styles.back} onClick={() => go("pricing")}>
                  Edit plan <FiArrowRight />
                </button>
              )}
            </div>
          </section>
          <aside className={styles.sidebar}>
            <Summary result={result} />
            {step !== "review" && (
              <button
                className={styles.summaryAction}
                disabled={!result.valid}
                onClick={() => go("review")}
              >
                View customer message <FiArrowRight />
              </button>
            )}
            <CalculationDetails result={result} />
          </aside>
        </div>
        <p className={styles.copyStatus} role="status" aria-live="polite">
          {copyFeedback}
        </p>
      </main>
      <div className={styles.mobileDock}>
        <div>
          <span>{result.valid ? "Current total" : "Check inputs"}</span>
          <strong key={result.valid ? result.total : "invalid"}>
            {result.valid ? formatNaira(result.total) : "—"}
          </strong>
        </div>
        <div className={styles.dockActions}>
        {stepIndex > 0 && <button className={styles.arrowBack} aria-label="Previous step" onClick={() => go(steps[stepIndex - 1])}><FiArrowLeft /></button>}
        <button
          className={styles.primary}
          disabled={
            !mode || (step === "review" ? !result.valid : !!currentError)
          }
          onClick={() =>
            step === "review" ? copy(message, "Message") : go(next)
          }
        >
          {step === "review" ? (
            <>
              <FiCopy /> Copy message
            </>
          ) : (
            <>
              Continue <FiArrowRight />
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
}
function Choice({ selected, onClick, title, description, detail }) {
  return (
    <button
      className={`${styles.choice} ${selected ? styles.selectedChoice : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={styles.choiceTitle}>
        {title}
        <span className={styles.radio}>{selected && <FiCheck />}</span>
      </span>
      <p>{description}</p>
      <small>{detail}</small>
    </button>
  );
}
function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function CalculationDetails({ result: r }) {
  if (!r.valid) return null;
  return (
    <details className={styles.details}>
      <summary>
        How this quote adds up <FiChevronDown />
      </summary>
      <div className={styles.internalMath}>
        <Row
          label="Budget-based management"
          value={formatNaira(r.baseManagementFee)}
        />
        {
          <>
            <Row
              label="Duration multiplier"
              value={r.durationMultiplier.toFixed(4) + "×"}
            />
            <Row
              label="Rounded management"
              value={formatNaira(r.calculatedManagementFee)}
            />
          </>
        }
        {r.manualAdjustment && (
          <Row
            label="Management after adjustment"
            value={formatNaira(r.managementFee)}
          />
        )}
        <Row
          label="Individual video management"
          value={formatNaira(r.creativeFee)}
        />
        <p>
          Internal only. Formulas are never included in the customer message.
        </p>
      </div>
    </details>
  );
}
function Summary({ result: r }) {
  return (
    <section className={styles.summary} aria-label="Live quote summary">
      <span className={styles.eyebrow}>YOUR QUOTE</span>
      <div className={styles.amount} key={r.valid ? r.total : "invalid"}>
        {r.valid ? formatNaira(r.total) : "—"}
      </div>
      <p className={styles.summaryCaption}>
        {r.valid
          ? r.mode === "recommend"
            ? "Recommended package"
            : "Custom campaign"
          : "Complete the inputs to see a valid quote."}
        {r.manualAdjustment && " · Manually adjusted"}
      </p>
      {r.valid && (
        <>
          <div className={styles.totals}>
            <Row
              label="Advertising budget"
              value={formatNaira(r.advertisingBudget)}
            />
            <Row label="Service fee" value={formatNaira(r.serviceFee)} />
            {r.creativeFee > 0 && (
              <small>
                Includes {formatNaira(r.creativeFee)} individual video
                management
              </small>
            )}
            {r.scriptSupportFee > 0 && (
              <Row
                label="Content script"
                value={formatNaira(r.scriptSupportFee)}
              />
            )}
            {r.setupServiceFee > 0 && (
              <Row
                label="Ads Manager setup"
                value={formatNaira(r.setupServiceFee)}
              />
            )}
          </div>
          <div className={styles.quoteMeta}>
            <span>
              <b>
                {r.duration} {r.duration === 1 ? "day" : "days"}
              </b>
              Management duration
            </span>
            <span>
              <b>
                {r.creativeCount} {r.creativeCount === 1 ? "video" : "videos"}
              </b>
              {r.creativeMode === "testing"
                ? "Creative testing"
                : "Advertised individually"}
            </span>
          </div>
          {r.creativeMode === "individual" && (
            <p className={styles.budgetNote}>
              {formatNaira(r.baseAdBudget)} per video × {r.creativeCount} ={" "}
              <b>{formatNaira(r.advertisingBudget)}</b>
              <br />
              Approx. {formatNaira(r.dailyBudgetPerCreative)} / day per video.
            </p>
          )}
          <p className={styles.budgetNote}>
            Approx. {formatNaira(r.dailyBudget)} / day{" "}
            {r.creativeMode === "individual"
              ? "combined ad budget"
              : "ad budget"}
            .
          </p>
          {r.warnings.map((warning) => (
            <p className={styles.summaryWarning} key={warning}>
              {warning}
            </p>
          ))}
        </>
      )}
    </section>
  );
}
function MessageBox({ message, view, onView, onCopy }) {
  return (
    <section className={styles.messageBox} aria-label="Customer message">
      <div className={styles.messageHeader}>
        <span className={styles.eyebrow}>READY TO SEND</span>
        <span>Customer message</span>
      </div>
      <div className={styles.segment} role="group" aria-label="Message format">
        {[
          ["simple", "Simple message"],
          ["breakdown", "Full breakdown"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={view === value}
            onClick={() => onView(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <pre key={view} className={styles.message}>
        {message}
      </pre>
      <button className={styles.primary} onClick={onCopy}>
        <FiCopy /> Copy message
      </button>
    </section>
  );
}
