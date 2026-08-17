import { useState } from "react";
import API from "../utils/api";
import styles from "../styles/GrowthAssessment.module.css";

const initialForm = {
  fullName: "",
  businessName: "",
  whatsappNumber: "",
  email: "",
  websiteOrSocialPage: "",
  businessType: "",
  businessAge: "",
  monthlyRevenue: "",
  marketingPlatforms: [],
  paidAdsExperience: "",
  monthlyAdSpend: "",
  adPlatformsUsed: [],
  biggestAdsProblem: "",
  marketingGoal: "",
  growthBlocker: "",
  attemptedSolutions: "",
  attemptedResults: "",
  sixMonthImpact: "",
  decisionAuthority: "",
  finalDecisionMaker: "",
  investmentCapacity: "",
  desiredHelp: "",
  urgency: "",
  implementationReadiness: "",
  extraContext: "",
};

const options = {
  businessType: [
    "Products",
    "Services",
    "Digital products/courses",
    "SaaS/software",
    "Agency/marketing services",
    "Other",
  ],
  businessAge: [
    "Less than 3 months",
    "3-6 months",
    "6-12 months",
    "1-3 years",
    "3+ years",
  ],
  monthlyRevenue: [
    "NGN 0-NGN 100k",
    "NGN 100k-NGN 500k",
    "NGN 500k-NGN 1m",
    "NGN 1m-NGN 5m",
    "NGN 5m-NGN 10m",
    "NGN 10m+",
  ],
  marketingPlatforms: [
    "TikTok",
    "Instagram",
    "Facebook",
    "Google",
    "YouTube",
    "WhatsApp",
    "Other",
  ],
  paidAdsExperience: [
    "Never",
    "Yes, but only occasionally",
    "Yes, consistently",
    "Yes, and I am currently running ads",
  ],
  monthlyAdSpend: [
    "NGN 0",
    "Below NGN 50k",
    "NGN 50k-NGN 100k",
    "NGN 100k-NGN 500k",
    "NGN 500k-NGN 1m",
    "NGN 1m-NGN 5m",
    "NGN 5m+",
  ],
  adPlatformsUsed: ["TikTok Ads", "Meta Ads", "Google Ads", "Other"],
  biggestAdsProblem: [
    "I am getting views but not sales",
    "I am getting clicks/messages but not enough customers",
    "My cost per customer is too high",
    "I do not know what type of content/creative to use",
    "I do not know how to structure my campaigns",
    "My campaigns do not scale",
    "I do not understand my data",
    "I have tried several strategies and nothing works consistently",
    "Other",
  ],
  decisionAuthority: [
    "Yes",
    "I make the decisions together with someone else",
    "No",
  ],
  investmentCapacity: [
    "I am only looking for free information",
    "Below NGN 50k",
    "NGN 50k-NGN 100k",
    "NGN 100k-NGN 250k",
    "NGN 250k-NGN 500k",
    "NGN 500k-NGN 1m",
    "NGN 1m+",
  ],
  desiredHelp: [
    "Free advice/resources",
    "Ads account audit",
    "Business/marketing strategy",
    "Ads management",
    "Content/creative strategy",
    "TikTok/Meta Ads setup",
    "Full marketing direction",
    "I am not sure yet, I need someone to diagnose the problem",
  ],
  urgency: [
    "Just researching",
    "Within the next 1-3 months",
    "Within the next few weeks",
    "Immediately",
  ],
  implementationReadiness: [
    "Yes",
    "Possibly, depending on the recommendation",
    "No, I am only looking for free advice",
  ],
};

export default function GrowthAssessment() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleOption = (field, value) => {
    setForm((current) => {
      const selected = current[field];

      return {
        ...current,
        [field]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  };

  const submitAssessment = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await API.post("/growth-assessment", form);
      setResult(response.data.result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to submit your assessment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <main className={styles.tutorialPage}>
        <section className={styles.resultPanel}>
          <span className={styles.tutorialBadge}>Assessment complete</span>
          <h1>{result.recommendationTitle}</h1>
          <p className={styles.tutorialIntro}>{result.recommendationMessage}</p>

          <div className={styles.scoreCard}>
            <span>Your assessment score</span>
            <strong>{result.score}/100</strong>
            <small>{result.endpoint.replaceAll("_", " ")}</small>
          </div>

          <a className={styles.primaryButton} href={result.redirectUrl}>
            {result.recommendedAction}
          </a>

          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => {
              setResult(null);
              setForm(initialForm);
            }}
          >
            Retake Assessment
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.tutorialPage}>
      <section className={styles.tutorialPanel}>
        <span className={styles.tutorialBadge}>Joshspot Growth Assessment</span>
        <h1>
          Let&apos;s find the <span>right next move</span> for your business.
        </h1>
        <p className={styles.tutorialIntro}>
          Answer these questions honestly. Your responses help us decide whether
          you need free resources, an audit, a paid strategy session, or a
          strategic growth call.
        </p>

        <div className={styles.assessmentNote}>
          <strong>This takes about 3-5 minutes.</strong>
          <p>
            There are no right or wrong answers. The clearer your answers are,
            the better the recommendation will be.
          </p>
        </div>

        <form
          className={styles.assessmentForm}
          id="assessment-form"
          onSubmit={submitAssessment}
        >
          <FormSection number="01" title="Contact details">
            <div className={styles.twoColumn}>
              <Field
                label="Full Name"
                value={form.fullName}
                onChange={(value) => updateField("fullName", value)}
                required
              />
              <Field
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                required
              />
              <Field
                label="WhatsApp Number"
                value={form.whatsappNumber}
                onChange={(value) => updateField("whatsappNumber", value)}
                required
              />
              <Field
                label="Business/Brand Name"
                value={form.businessName}
                onChange={(value) => updateField("businessName", value)}
                required
              />
            </div>
            <Field
              label="Website or social media page"
              value={form.websiteOrSocialPage}
              onChange={(value) => updateField("websiteOrSocialPage", value)}
              required
            />
          </FormSection>

          <FormSection number="02" title="Business background">
            <Options
              label="1. What does your business sell?"
              name="businessType"
              options={options.businessType}
              value={form.businessType}
              onChange={(value) => updateField("businessType", value)}
            />
            <Options
              label="2. How long have you been running the business?"
              name="businessAge"
              options={options.businessAge}
              value={form.businessAge}
              onChange={(value) => updateField("businessAge", value)}
            />
            <Options
              label="3. What is your average monthly revenue?"
              name="monthlyRevenue"
              options={options.monthlyRevenue}
              value={form.monthlyRevenue}
              onChange={(value) => updateField("monthlyRevenue", value)}
            />
          </FormSection>

          <FormSection number="03" title="Current marketing">
            <Checkboxes
              label="4. Which platforms are you currently using to market your business?"
              options={options.marketingPlatforms}
              value={form.marketingPlatforms}
              onChange={(value) => toggleOption("marketingPlatforms", value)}
            />
            <Options
              label="5. Have you run paid advertising before?"
              name="paidAdsExperience"
              options={options.paidAdsExperience}
              value={form.paidAdsExperience}
              onChange={(value) => updateField("paidAdsExperience", value)}
            />
            <Options
              label="6. Approximately how much do you currently spend on advertising per month?"
              name="monthlyAdSpend"
              options={options.monthlyAdSpend}
              value={form.monthlyAdSpend}
              onChange={(value) => updateField("monthlyAdSpend", value)}
            />
            <Checkboxes
              label="7. Which advertising platforms have you used?"
              options={options.adPlatformsUsed}
              value={form.adPlatformsUsed}
              onChange={(value) => toggleOption("adPlatformsUsed", value)}
            />
            <Options
              label="8. What has been your biggest problem with advertising?"
              name="biggestAdsProblem"
              options={options.biggestAdsProblem}
              value={form.biggestAdsProblem}
              onChange={(value) => updateField("biggestAdsProblem", value)}
            />
          </FormSection>

          <FormSection number="04" title="The actual business problem">
            <TextArea
              label="9. What are you currently trying to achieve with your marketing?"
              value={form.marketingGoal}
              onChange={(value) => updateField("marketingGoal", value)}
              required
            />
            <TextArea
              label="10. What do you believe is currently stopping your business from growing?"
              value={form.growthBlocker}
              onChange={(value) => updateField("growthBlocker", value)}
              required
            />
            <TextArea
              label="11. What have you already tried to solve the problem?"
              value={form.attemptedSolutions}
              onChange={(value) => updateField("attemptedSolutions", value)}
              required
            />
            <TextArea
              label="12. What happened after you tried those things?"
              value={form.attemptedResults}
              onChange={(value) => updateField("attemptedResults", value)}
              required
            />
            <TextArea
              label="13. If nothing changes over the next 6 months, what would that mean for your business?"
              value={form.sixMonthImpact}
              onChange={(value) => updateField("sixMonthImpact", value)}
              required
            />
          </FormSection>

          <FormSection number="05" title="Decision-making">
            <Options
              label="14. Are you the person who makes the final marketing decisions for this business?"
              name="decisionAuthority"
              options={options.decisionAuthority}
              value={form.decisionAuthority}
              onChange={(value) => updateField("decisionAuthority", value)}
            />
            {form.decisionAuthority === "No" && (
              <Field
                label="15. Who makes the final decision?"
                value={form.finalDecisionMaker}
                onChange={(value) => updateField("finalDecisionMaker", value)}
                required
              />
            )}
          </FormSection>

          <FormSection number="06" title="Investment and readiness">
            <Options
              label="16. How much are you currently willing to invest in getting this problem solved?"
              name="investmentCapacity"
              options={options.investmentCapacity}
              value={form.investmentCapacity}
              onChange={(value) => updateField("investmentCapacity", value)}
            />
            <Options
              label="17. What are you looking for right now?"
              name="desiredHelp"
              options={options.desiredHelp}
              value={form.desiredHelp}
              onChange={(value) => updateField("desiredHelp", value)}
            />
            <Options
              label="18. How soon are you looking to solve this problem?"
              name="urgency"
              options={options.urgency}
              value={form.urgency}
              onChange={(value) => updateField("urgency", value)}
            />
            <Options
              label="19. If I believe I can help your business, are you prepared to invest in implementing the recommended strategy?"
              name="implementationReadiness"
              options={options.implementationReadiness}
              value={form.implementationReadiness}
              onChange={(value) =>
                updateField("implementationReadiness", value)
              }
            />
            <TextArea
              label="20. Is there anything else I should know about your business before assessing it?"
              value={form.extraContext}
              onChange={(value) => updateField("extraContext", value)}
            />
          </FormSection>

          <button className={styles.primaryButton} disabled={loading} type="submit">
            {loading ? "Assessing..." : "Submit My Growth Assessment"}
          </button>
        </form>
      </section>
    </main>
  );
}

function FormSection({ number, title, children }) {
  return (
    <section className={styles.formSection}>
      <div className={styles.sectionHeading}>
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, required = false }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <textarea
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Options({ label, name, options, value, onChange }) {
  return (
    <fieldset className={styles.optionGroup}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              required
              onChange={(event) => onChange(event.target.value)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Checkboxes({ label, options, value, onChange }) {
  return (
    <fieldset className={styles.optionGroup}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              value={option}
              checked={value.includes(option)}
              onChange={(event) => onChange(event.target.value)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
