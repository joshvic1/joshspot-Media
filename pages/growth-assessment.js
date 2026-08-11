import { useState } from "react";
import API from "../utils/api";
import styles from "../styles/GrowthAssessment.module.css";

const initialForm = {
  fullName: "",
  businessName: "",
  whatsappNumber: "",
  email: "",
  businessWebsite: "",
  socialPage: "",
  businessOffer: "",
  idealCustomers: "",
  businessAge: "",
  biggestChallenge: "",
  adsExperience: "",
  adsChallenge: "",
  monthlyAdSpend: "",
  ninetyDayGoal: "",
  openToStrategyCall: "",
  extraNotes: "",
};

const businessAgeOptions = [
  "Less than 6 months",
  "6-12 months",
  "1-3 years",
  "More than 3 years",
];

const challengeOptions = [
  "Getting more customers",
  "Making more sales",
  "Running profitable ads",
  "Building brand awareness",
  "Low conversion rate",
  "Other",
];

const adsExperienceOptions = [
  "Never",
  "Yes, but they did not work",
  "Yes, and they are currently running",
];

const adSpendOptions = [
  "I do not run ads yet",
  "Less than NGN 100,000",
  "NGN 100,000-NGN 500,000",
  "NGN 500,000-NGN 1 million",
  "Above NGN 1 million",
];

const strategyOptions = ["Yes", "Maybe", "Not at the moment"];

export default function GrowthAssessment() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitAssessment = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await API.post("/growth-assessment", form);
      setSubmitted(true);
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

  if (submitted) {
    return (
      <main className={styles.page}>
        <section className={styles.thankYouCard}>
          <span className={styles.badge}>Assessment received</span>
          <h1>Thank You!</h1>
          <p>I have received your assessment.</p>
          <p>
            I will personally review your responses as soon as possible. If I
            believe Joshspot Media is the right fit for your business, I will
            reach out to you directly to discuss the next steps.
          </p>
          <p>
            If I think another solution would serve you better right now, I will
            point you toward free resources that can help.
          </p>
          <p>Thank you for trusting me with your business.</p>
          <strong>- Joshspot Media</strong>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.badge}>Growth Assessment</span>
          <h1>Let&apos;s Find Out How To Grow/Market Your Business</h1>
          <p>
            Every business is different. The strategy that works for one brand
            may completely fail for another.
          </p>
          <p>
            Before recommending any marketing service, I want to understand your
            business, your goals, and the challenges you are currently facing.
            Take 3-5 minutes to complete this assessment.
          </p>
          <p>
            I will personally review your responses and recommend the best next
            step for your business.
          </p>
          <a href="#assessment-form" className={styles.heroButton}>
            Start My Growth Assessment
          </a>
        </div>

        <div className={styles.promiseCard}>
          <h2>What happens after you submit?</h2>
          <ul>
            <li>I will personally review your business.</li>
            <li>
              If I believe we can help you achieve meaningful results, I will
              contact/call you to discuss a strategy tailored to your business.
            </li>
          </ul>
          <p>My goal is to help you make the right marketing decision.</p>
        </div>
      </section>

      <section className={styles.beforeCard}>
        <span className={styles.badge}>Before you begin</span>
        <h2>Please answer every question honestly.</h2>
        <p>
          There are no right or wrong answers. The more accurate your answers
          are, the better I can understand your business and recommend the right
          solution.
        </p>
      </section>

      <form
        className={styles.form}
        id="assessment-form"
        onSubmit={submitAssessment}
      >
        <section className={styles.formSection}>
          <div className={styles.sectionIntro}>
            <span>01</span>
            <h2>Business Information</h2>
          </div>

          <div className={styles.grid}>
            <Field
              label="Full Name"
              value={form.fullName}
              onChange={(value) => updateField("fullName", value)}
              required
            />
            <Field
              label="Business Name"
              value={form.businessName}
              onChange={(value) => updateField("businessName", value)}
              required
            />
            <Field
              label="WhatsApp Number"
              value={form.whatsappNumber}
              onChange={(value) => updateField("whatsappNumber", value)}
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
              label="Business Website (Optional)"
              value={form.businessWebsite}
              onChange={(value) => updateField("businessWebsite", value)}
            />
            <Field
              label="Instagram/Facebook/TikTok Page (Optional)"
              value={form.socialPage}
              onChange={(value) => updateField("socialPage", value)}
            />
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionIntro}>
            <span>02</span>
            <h2>About Your Business</h2>
          </div>

          <TextArea
            label="1. What does your business sell?"
            value={form.businessOffer}
            onChange={(value) => updateField("businessOffer", value)}
            required
          />
          <TextArea
            label="2. Who are your ideal customers?"
            value={form.idealCustomers}
            onChange={(value) => updateField("idealCustomers", value)}
            required
          />
          <Options
            label="3. How long have you been in business?"
            options={businessAgeOptions}
            value={form.businessAge}
            onChange={(value) => updateField("businessAge", value)}
          />
          <Options
            label="4. What is your biggest challenge right now?"
            options={challengeOptions}
            value={form.biggestChallenge}
            onChange={(value) => updateField("biggestChallenge", value)}
          />
          <Options
            label="5. Have you run TikTok or Meta ads before?"
            options={adsExperienceOptions}
            value={form.adsExperience}
            onChange={(value) => updateField("adsExperience", value)}
          />
          <TextArea
            label="6. If you have run ads before, what was your biggest challenge?"
            value={form.adsChallenge}
            onChange={(value) => updateField("adsChallenge", value)}
          />
          <Options
            label="7. Approximately how much do you spend on advertising each month?"
            options={adSpendOptions}
            value={form.monthlyAdSpend}
            onChange={(value) => updateField("monthlyAdSpend", value)}
          />
          <TextArea
            label="8. What are you hoping to achieve in the next 90 days?"
            value={form.ninetyDayGoal}
            onChange={(value) => updateField("ninetyDayGoal", value)}
            required
          />
          <Options
            label="9. If we believe we can genuinely help your business grow, would you be open to discussing a custom growth strategy with us?"
            options={strategyOptions}
            value={form.openToStrategyCall}
            onChange={(value) => updateField("openToStrategyCall", value)}
          />
          <TextArea
            label="10. Is there anything else you would like us to know about your business?"
            value={form.extraNotes}
            onChange={(value) => updateField("extraNotes", value)}
          />
        </section>

        <button
          className={styles.submitButton}
          disabled={loading}
          type="submit"
        >
          {loading ? "Submitting..." : "Submit My Growth Assessment"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {required && <em>*</em>}
      </span>
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
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      <textarea
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Options({ label, options, value, onChange }) {
  return (
    <fieldset className={styles.options}>
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={label}
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
