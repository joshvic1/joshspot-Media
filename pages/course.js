import Head from "next/head";
import StatusAdPreview from "../components/StatusAdPreview";
import { captureCourseAttribution } from "../utils/courseAttribution";
import { trackCourse, trackCoursePurchase } from "../utils/coursePixel";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiCopy,
  FiLock,
  FiLoader,
  FiMessageCircle,
  FiSend,
  FiX,
} from "react-icons/fi";
import styles from "../styles/Course.module.css";
import modern from "../styles/WhatsAppCourse.module.css";

const COURSE_PRICE = 8000;
const SLASHED_PRICE = 20000;

const modules = [
  {
    title: "TikTok ads training",
    text: "How to register on ads manager, set things up and start running ads from scratch even if you are a beginner.",
  },
  {
    title: "Facebook ads training",
    text: "How to create campaigns on Facebook without getting confused by all the plenty buttons inside ads manager.",
  },
  {
    title: "Instagram ads training",
    text: "How to run ads to your Instagram page, WhatsApp or website so people can see what you sell.",
  },
  {
    title: "Online store setup",
    text: "How to create a simple store where people can check your products, click, order and pay attention to your offer.",
  },
  {
    title: "Ads manager setup",
    text: "How to open and arrange your ads account properly before you start spending money.",
  },
  {
    title: "Card and funding guide",
    text: "How to understand the payment side, add card/funding and avoid being stuck when you want to run ads.",
  },
  {
    title: "Targeting explained",
    text: "How to choose the kind of people that should see your ads instead of showing your ad to everybody.",
  },
  {
    title: "Landing page basics",
    text: "How to connect your ad to a page/store that makes it easier for people to buy or message you.",
  },
  {
    title: "Ad content ideas",
    text: "How to know the kind of video or picture to use so your ad will not just be beautiful but useless.",
  },
  {
    title: "How to read results",
    text: "How to check your ad result and understand what is working, what is wasting money and what to fix.",
  },
  {
    title: "Retargeting basics",
    text: "How to reach people again after they have watched, clicked or shown interest in what you sell.",
  },
  {
    title: "Mistakes to avoid",
    text: "The common things beginners do that make them waste money before they even understand what happened.",
  },
];

const reviewProofs = [
  {
    src: "/images/course-review-1.jpg",
    title: "Review proof 1",
  },
  {
    src: "/images/course-review-2.jpg",
    title: "Review proof 2",
  },
  {
    src: "/images/course-review-3.jpg",
    title: "Review proof 3",
  },
  {
    src: "/images/course-review-4.jpg",
    title: "Review proof 4",
  },
];

const NEXT_PRICE = 20000;
const PRICE_REVIEW_SECONDS = 2 * 60 * 60;

const formatMoney = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const whatsappModules = [
  {
    "title": "Complete WhatsApp Status Ads Training",
    "text": "Learn how WhatsApp Status advertising works and how to start running ads for your business."
  },
  {
    "title": "Creating Your First WhatsApp Status Ad",
    "text": "Follow the entire process from creating your campaign to getting your advert ready to run."
  },
  {
    "title": "Choosing Who Sees Your Ads",
    "text": "Learn how to select the location, audience and other targeting options for the people you want to reach."
  },
  {
    "title": "Budget & Payment Setup",
    "text": "Learn how to set your advertising budget, add your payment method and understand how you're charged for your ads."
  },
  {
    "title": "How to create a good ads content",
    "text": "Learn what kind of videos, pictures and messages to use when advertising your business on WhatsApp Status."
  },
  {
    "title": "Sending People From Your Ad to Your Business",
    "text": "Learn how to set up where people go after seeing or clicking your advert .. Whether to your dm, group, website or anywhere at all"
  },
  {
    "title": "Monitoring Your WhatsApp Ads",
    "text": "Learn where to check your campaign and see how your advert is performing after it starts running."
  },
  {
    "title": "Understanding Your Ad Results",
    "text": "Learn what the important numbers mean so you're not just spending money without knowing what is happening."
  },
  {
    "title": "Common Mistakes to Avoid",
    "text": "Learn the mistakes that can cause beginners to waste money or set up their WhatsApp Status ads incorrectly."
  }
];

export default function CoursePage({ variant = "ads" }) {
  const isWhatsApp = variant === "whatsapp";
  const pageStyles = isWhatsApp ? modern : null;
  const COURSE_PRICE = isWhatsApp ? 10000 : 8000;
  const SLASHED_PRICE = isWhatsApp ? 30000 : 20000;
  const router = useRouter();
  useEffect(() => {
    captureCourseAttribution();
  }, []);
  const previewPaid =
    process.env.NODE_ENV === "development" && router.query.preview === "paid";
  const [timeLeft, setTimeLeft] = useState(PRICE_REVIEW_SECONDS);
  const [animatedNextPrice, setAnimatedNextPrice] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [whatsapp, setWhatsapp] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [copied, setCopied] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const previewInvoice = previewPaid
    ? {
        status: "paid",
        preview: true,
        courses: [
          {
            title: "How to run TikTok ads",
            url: "https://t.me/+zpLNcLN6nAhhNDY8",
          },
          {
            title: "Facebook & Instagram Ads",
            url: "https://t.me/+RwLlZhhBUXk2ZDk0",
          },
        ],
      }
    : null;
  const accessInvoice = previewInvoice || invoice;

  useEffect(() => {
    if (!router.isReady) return;
    trackCourse("PageView", {}, { once: "course-pageview" });
    trackCourse(
      "ViewContent",
      { value: COURSE_PRICE },
      { once: "course-view" },
    );
  }, [router.isReady]);

  useEffect(() => {
    trackCoursePurchase(invoice);
  }, [invoice]);

  useEffect(() => {
    if (isWhatsApp) return;
    let deadline = Date.now() + PRICE_REVIEW_SECONDS * 1000;
    try {
      const saved = Number(window.localStorage.getItem("courseOfferDeadline"));
      if (Number.isFinite(saved) && saved > 0) deadline = Math.min(saved, deadline);
      else {
        const remaining = window.localStorage.getItem("courseOfferTimer");
        if (remaining !== null && Number.isFinite(Number(remaining))) {
          deadline = Date.now() + Math.max(0, Math.min(PRICE_REVIEW_SECONDS, Number(remaining))) * 1000;
        }
      }
      window.localStorage.setItem("courseOfferDeadline", String(deadline));
    } catch { /* The countdown still works when browser storage is unavailable. */ }
    const update = () => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [isWhatsApp]);

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(NEXT_PRICE / 40);
    const counter = window.setInterval(() => {
      current = Math.min(NEXT_PRICE, current + step);
      setAnimatedNextPrice(current);

      if (current >= NEXT_PRICE) {
        window.clearInterval(counter);
      }
    }, 30);

    return () => window.clearInterval(counter);
  }, []);

  useEffect(() => {
    if (!invoice?.token || invoice.status !== "pending") return undefined;

    const poll = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/course-invoice?token=${invoice.token}`,
        );
        const data = await response.json();

        if (response.ok) {
          setInvoice(data);

          if (data.status === "paid") {
            window.clearInterval(poll);
            setDrawerOpen(true);
          }
        }
      } catch (error) {
        console.log("COURSE PAYMENT POLL ERROR:", error);
      }
    }, 5000);

    return () => window.clearInterval(poll);
  }, [invoice?.token, invoice?.status]);

  const openCheckout = () => {
    if (accessInvoice?.status !== "paid")
      trackCourse(
        "InitiateCheckout",
        { value: COURSE_PRICE, num_items: 1 },
        { once: "course-checkout" },
      );
    setDrawerOpen(true);
    setPaymentError("");
  };

  const getFullWhatsappNumber = () => {
    const cleanCode = countryCode.trim();
    const cleanNumber = whatsapp.replace(/[^\d]/g, "");
    const localNumber =
      cleanCode === "+234" && cleanNumber.startsWith("0")
        ? cleanNumber.slice(1)
        : cleanNumber;

    return `${cleanCode}${localNumber}`;
  };

  const startTransferPayment = async (event) => {
    event.preventDefault();
    setPaymentError("");

    if (!name.trim() || !whatsapp.trim()) {
      setPaymentError("Please enter your name and WhatsApp number.");
      return;
    }

    const fullWhatsapp = getFullWhatsappNumber();

    if (fullWhatsapp.length < 8) {
      setPaymentError("Please enter a valid WhatsApp number.");
      return;
    }

    setLoadingPayment(true);

    try {
      const response = await fetch("/api/course-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          whatsapp: fullWhatsapp,
          email: checkoutEmail,
          product: isWhatsApp ? "whatsapp-course" : "ads-course",
          attribution: captureCourseAttribution(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create payment account.");
      }

      setInvoice(data.invoice);
      trackCourse("Lead", { value: COURSE_PRICE }, { once: "course-lead" });
      trackCourse(
        "CoursePaymentAccountCreated",
        {},
        { custom: true, once: "course-account" },
      );
    } catch (error) {
      setPaymentError(error.message || "Unable to create payment account.");
    } finally {
      setLoadingPayment(false);
    }
  };

  const confirmPayment = async () => {
    if (!invoice?.token) return;

    trackCourse("CoursePaymentCheck", {}, { custom: true });
    setConfirmingPayment(true);
    setPaymentError("");

    try {
      const response = await fetch(
        `/api/course-invoice?token=${invoice.token}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm payment now.");
      }

      setInvoice(data);

      if (data.status === "paid") {
        return;
      }

      setPaymentError(
        "Payment has not reflected yet. Please wait a little and click I have paid again.",
      );
    } catch (error) {
      setPaymentError(error.message || "Unable to confirm payment now.");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const copyText = async (label, value) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    trackCourse("CoursePaymentDetailsCopied", {}, { custom: true });
    window.setTimeout(() => setCopied(""), 1300);
  };

  const askQuestion = async (event) => {
    event.preventDefault();

    if (!question.trim() || asking) return;

    setAsking(true);
    setAnswer("");
    setAskedQuestion(question.trim());

    try {
      const response = await fetch("/api/course-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, product: isWhatsApp ? "whatsapp-course" : "ads-course" }),
      });
      const data = await response.json();

      if (response.ok)
        trackCourse("CourseQuestionAnswered", {}, { custom: true });
      setAnswer(
        response.ok
          ? data.answer
          : data.message || "I could not answer that right now.",
      );
    } catch (error) {
      setAnswer("I could not answer that right now. Please try again.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          {isWhatsApp
            ? "WhatsApp Status Ads Course | Joshspot Media"
            : "COURSE | Joshspot Media"}
        </title>
        {isWhatsApp && (
          <meta
            name="description"
            content="Learn how to run ads in WhatsApp Status with Joshspot Media. Understand account access, campaign setup, Status creatives, budgets and results. Course price: ₦10,000."
          />
        )}
      </Head>

      {!isWhatsApp && <div className={styles.offerStrip}>
        <span>Originally <del>₦20,000</del> <strong>Now ₦8,000</strong> <b>Save 60%</b></span>
        <span><FiClock aria-hidden="true" /> Discount ends in <strong role="timer" aria-label="Discount countdown">{formatTime(timeLeft)}</strong></span>
      </div>}
      <main className={`${styles.page} ${pageStyles?.page || styles.withStickyPay}`}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>
              {isWhatsApp
                ? "Learn how to run ads on WhatsApp Status."
                : "Learn how to run TikTok, Facebook and Instagram ads that can help you sell online."}
            </h1>
            <p>
              {isWhatsApp
                ? "I'm sure you have been posting your businesss on your status, but it is still the same people viewing it. Good news, WhatsApp now allows you to run status ads. I will be teaching you how to set up a WhatsApp status ads yourself, step by step, even if you have never run tried it before."
                : "If you have been seeing people run ads and you keep wondering how they are doing it, this course will show you the process in a very simple way."}
            </p>

            {!isWhatsApp && (
              <div className={styles.heroIncludes}>
                <span>What you will get</span>
                <div className={styles.heroModuleGrid}>
                  {(isWhatsApp ? whatsappModules : modules).map((module) => (
                    <article key={module.title}>
                      <FiCheck aria-hidden="true" />
                      <div>
                        <strong>{module.title}</strong>
                        {!isWhatsApp && <p>{module.text}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.heroProof}>
            {isWhatsApp ? (
              <StatusAdPreview />
            ) : (
              <img
                alt="Course folder showing TikTok Ads Manager training modules"
                src="/images/ads-course.jpg"
              />
            )}
          </div>
        </section>
        {isWhatsApp && (
          <section id="curriculum" className={modern.curriculum}>
            <div className={modern.sectionHeading}>
              <h2>What you will get for ₦10,000</h2>
            </div>
            <div className={modern.modules}>
              {whatsappModules.map((module) => (
                <article key={module.title}>
                  <FiCheck aria-hidden="true" />
                  <div>
                    <h3>{module.title}</h3>
                    <p>{module.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!isWhatsApp && (
          <section className={styles.reviewSection}>
            <div className={styles.sectionTitle}>
              <span>Course reviews</span>
              <h2>
                See reviews from people that have purchased our course already
              </h2>
            </div>

            <div className={styles.reviewGrid}>
              {reviewProofs.map((proof, index) => (
                <ReviewProof key={proof.src} proof={proof} index={index} />
              ))}
            </div>
          </section>
        )}

        <>
          <section className={`${styles.priceSection} ${isWhatsApp ? modern.pricingCard : ""}`}>
            <div className={styles.priceStack}>
              <span>
                Get a lifetime access to this course for just a one time payment
                of
              </span>
              <strong>{formatMoney(COURSE_PRICE)}</strong>
              <del>{formatMoney(SLASHED_PRICE)}</del>
            </div>

            <div className={styles.heroActions}>
              <button onClick={openCheckout} type="button">
                Pay now ({formatMoney(COURSE_PRICE)}){" "}
                <FiArrowRight aria-hidden="true" />
              </button>
              <a href="#ask">Ask me a question first</a>
            </div>
          </section>

          {!isWhatsApp && (
            <section className={styles.priceTimer}>
              <div>
                <span>
                  <FiClock aria-hidden="true" />
                  Price will increase soon
                </span>
                <h2>
                  Due to high demand for this course, we will increase the price
                  in <strong>{formatTime(timeLeft)}</strong>
                </h2>
                <p>
                  The price is currently {formatMoney(COURSE_PRICE)}. In the
                  next 2 hours, we will increase the price to{" "}
                  <strong className={styles.countingPrice}>
                    {formatMoney(animatedNextPrice || NEXT_PRICE)}
                  </strong>
                  .
                </p>
              </div>
              <div className={styles.timerAction}>
                <button onClick={openCheckout} type="button">
                  Pay now ({formatMoney(COURSE_PRICE)})
                </button>
              </div>
            </section>
          )}

          <section className={styles.questionCard} id="ask">
            <div>
              <span>{isWhatsApp ? "Not sure if this course is for you?" : "Ask me a question first"}</span>
              <h2>{isWhatsApp ? "Ask me a question first" : "Not sure if this course is for you?"}</h2>
            </div>
            <form onSubmit={askQuestion}>
              <input
                placeholder="Type your question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button
                disabled={asking}
                type="submit"
                aria-label="Send question"
              >
                <FiSend aria-hidden="true" />
              </button>
            </form>
            {(answer || asking) && (
              <div className={styles.chatBox}>
                {askedQuestion && (
                  <p className={`${styles.userBubble} ${isWhatsApp ? modern.questionUser : ""}`}>{askedQuestion}</p>
                )}
                <p className={`${styles.answerBubble} ${isWhatsApp ? modern.questionAnswer : ""}`}>
                  {asking ? "Typing..." : answer}
                </p>
              </div>
            )}
          </section>

          <section className={styles.finalCta}>
            <FiLock aria-hidden="true" />
            <h2>Get the full course for {formatMoney(COURSE_PRICE)}</h2>
            <p>
              Learn the basics once, then use it anytime you want to launch ads
              for your business.
            </p>
            <button onClick={openCheckout} type="button">
              Pay now ({formatMoney(COURSE_PRICE)}) and get access
            </button>
          </section>
        </>
      </main>
      {!drawerOpen && !previewPaid && (
        <div className={isWhatsApp ? modern.stickyPay : styles.stickyPay}>
          <span>
            {isWhatsApp ? "WhatsApp Status ads course" : "TikTok, Facebook & Instagram ads course"}
            <small>One payment · Lifetime access</small>
          </span>
          <button type="button" onClick={openCheckout}>
            Pay now · {formatMoney(COURSE_PRICE)} <FiArrowRight aria-hidden="true" />
          </button>
        </div>
      )}

      {(drawerOpen || previewPaid) && (
        <aside
          className={`${styles.drawerOverlay} ${isWhatsApp ? modern.checkout : ""}`}
        >
          <section
            className={`${styles.drawer} ${isWhatsApp ? modern.drawerPanel : ""}`}
          >
            <button
              className={styles.closeDrawer}
              onClick={() => {
                setDrawerOpen(false);
                if (previewPaid)
                  router.replace(
                    isWhatsApp ? "/whatsapp" : "/course",
                    undefined,
                    { shallow: true },
                  );
              }}
              type="button"
              aria-label="Close checkout"
            >
              <FiX aria-hidden="true" />
            </button>

            <div
              className={`${styles.drawerHeader} ${isWhatsApp ? modern.drawerHeading : ""}`}
            >
              {accessInvoice?.status !== "paid" && <span>Course checkout</span>}
              <h2>
                {accessInvoice?.status === "paid"
                  ? "Payment confirmed!"
                  : `Pay ${formatMoney(COURSE_PRICE)} by transfer`}
              </h2>
              {accessInvoice?.status !== "paid" && (
                <p>
                  Enter your details first. We will generate a Paystack transfer
                  account for this course payment.
                </p>
              )}
            </div>
            

            {previewPaid ? (
              <>
                <p className={styles.statusText} role="status">
                  Local preview only. No payment was made. Email sending is
                  simulated.
                </p>
                <CourseAccess
                  invoice={previewInvoice}
                  isWhatsApp={isWhatsApp}
                />
              </>
            ) : !invoice ? (
              <form
                className={`${styles.checkoutForm} ${isWhatsApp ? modern.detailsForm : ""}`}
                onSubmit={startTransferPayment}
              >
                <label>
                  Name
                  <input
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label>
                  WhatsApp number
                  <div className={styles.phoneFields}>
                    <select
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      aria-label="Country code"
                    >
                      <option value="+234">+234 NG</option>
                      <option value="+233">+233 GH</option>
                      <option value="+44">+44 UK</option>
                      <option value="+1">+1 US</option>
                      <option value="+27">+27 ZA</option>
                      <option value="+971">+971 UAE</option>
                    </select>
                    <input
                      placeholder="8012345678"
                      value={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.value)}
                      inputMode="tel"
                    />
                  </div>
                </label>
                <label>
                  Email address (optional)
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="you@example.com"
                    value={checkoutEmail}
                    onChange={(event) => setCheckoutEmail(event.target.value)}
                  />
                  <span>
                    Get your course links and a reminder if you have trouble
                    completing payment.
                  </span>
                </label>
                {paymentError && (
                  <p className={styles.errorText}>{paymentError}</p>
                )}
                <button disabled={loadingPayment} type="submit">
                  {loadingPayment
                    ? "Generating account..."
                    : "Pay with transfer"}
                </button>
              </form>
            ) : invoice.status === "paid" ? (
              <CourseAccess invoice={invoice} isWhatsApp={isWhatsApp} />
            ) : (
              <div className={`${styles.transferBox} ${isWhatsApp ? modern.transferDetails : ""}`}>
                <p className={styles.statusText}>
                  {isWhatsApp
                    ? "Transfer the exact amount below, then click I have paid. Once confirmed, you can message me on WhatsApp to get your course."
                    : "Transfer the exact amount below. After payment, click I have paid. Once confirmed, your Telegram course buttons will appear here."}
                </p>
                <CopyRow
                  copied={copied}
                  label="Amount"
                  value={formatMoney(invoice.amount)}
                  onCopy={copyText}
                />
                <CopyRow
                  copied={copied}
                  label="Account Number"
                  value={invoice.accountNumber || "Preparing..."}
                  onCopy={copyText}
                />
                <CopyRow
                  copied={copied}
                  label="Bank Name"
                  value={invoice.bankName || "Preparing..."}
                  onCopy={copyText}
                />
                <CopyRow
                  copied={copied}
                  label="Account Name"
                  value={invoice.accountName || "Joshspot Media"}
                  onCopy={copyText}
                />
                {paymentError && (
                  <p className={styles.errorText}>{paymentError}</p>
                )}
                <button
                  className={styles.confirmPaymentButton}
                  disabled={confirmingPayment}
                  onClick={confirmPayment}
                  type="button"
                >
                  {confirmingPayment ? (
                    <>
                      <FiLoader
                        aria-hidden="true"
                        className={styles.spinIcon}
                      />
                      Confirming payment...
                    </>
                  ) : (
                    <>
                      <FiMessageCircle aria-hidden="true" />I have paid
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        </aside>
      )}
    </>
  );
}

function CourseAccess({ invoice, isWhatsApp }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendLinks = async (event) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setMessage("");
    setError("");
    if (invoice.preview) {
      setMessage(
        "The video links has been sent to your email. Also check your spam folder too incase you can't find it in your inbox.",
      );
      setSending(false);
      return;
    }
    try {
      const response = await fetch("/api/course-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invoice.token, email }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "The email did not send. Please try again.",
        );
      setMessage(data.message);
      trackCourse("CourseLinksEmailed", {}, { custom: true });
    } catch (error) {
      setError(error.message || "The email did not send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`${styles.courseAccess} ${isWhatsApp ? modern.paidAccess : ""}`}>
      <section
        className={styles.emailAccess}
        aria-labelledby="save-course-links"
      >
        <h3 id="save-course-links">
          Enter your email below so i can send the courses link
        </h3>
        <p>
          After you enter your email below, i will send the courses link to you
          so you dont ever lose access to it and you can watch it anytime.
        </p>
        <form className={styles.checkoutForm} onSubmit={sendLinks}>
          <label htmlFor="course-email">Your email address</label>
          <input
            id="course-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" disabled={sending}>
            {sending
              ? "Sending your links..."
              : "Send the links to me via email"}
          </button>
          {message && (
            <p className={styles.statusText} role="status">
              {message}
            </p>
          )}
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
      {isWhatsApp ? <section className={styles.telegramAccess}>
        <h3>You are in! Let’s get you started.</h3>
        <p>Your payment is confirmed. Join the Telegram training channel to start your WhatsApp Status ads course.</p>
        <a className={styles.telegramButton} href={invoice.preview ? "https://t.me/+LimBMFUxVvphZTU0" : invoice.contactUrl} target="_blank" rel="noopener noreferrer"><FiSend /> Join WhatsApp course on Telegram</a>
      </section> : (      <section className={styles.telegramAccess} aria-labelledby="join-courses">
        <h3 id="join-courses">
          You can also, click the buttons below to access the courses directly
        </h3>
        {invoice.courses?.map((course) => (
          <a
            onClick={() => {
              if (!invoice.preview)
                trackCourse(
                  "CourseTelegramClick",
                  { course_name: course.title },
                  { custom: true },
                );
            }}
            key={course.url}
            className={styles.telegramButton}
            href={course.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiSend aria-hidden="true" /> Join {course.title}
          </a>
        ))}
      </section>
      )}
    </div>
  );
}

function CopyRow({ copied, label, onCopy, value }) {
  return (
    <div className={styles.copyRow}>
      <span>{label}</span>
      <strong>{value}</strong>
      <button onClick={() => onCopy(label, value)} type="button">
        {copied === label ? (
          <FiCheck aria-hidden="true" />
        ) : (
          <FiCopy aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function ReviewProof({ index, proof }) {
  const [failed, setFailed] = useState(false);

  return (
    <article className={styles.reviewCard}>
      {!failed ? (
        <img
          alt={proof.title}
          src={proof.src}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.reviewPlaceholder}>
          <span>Upload proof {index + 1}</span>
          <strong>course-review-{index + 1}.jpg</strong>
        </div>
      )}
    </article>
  );
}
