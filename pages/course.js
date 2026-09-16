import Head from "next/head";
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
const PRICE_REVIEW_SECONDS = 2 * 60 * 60 + 30 * 60;

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

export default function CoursePage() {
  const router = useRouter();
  useEffect(() => { captureCourseAttribution(); }, []);
  const previewPaid = process.env.NODE_ENV === "development" && router.query.preview === "paid";
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

  const previewInvoice = previewPaid ? {
    status: "paid",
    preview: true,
    courses: [
      { title: "How to run TikTok ads", url: "https://t.me/+zpLNcLN6nAhhNDY8" },
      { title: "Facebook & Instagram Ads", url: "https://t.me/+RwLlZhhBUXk2ZDk0" },
    ],
  } : null;
  const accessInvoice = previewInvoice || invoice;

  useEffect(() => {
    if (!router.isReady) return;
    trackCourse("PageView", {}, { once: "course-pageview" });
    trackCourse("ViewContent", { value: COURSE_PRICE }, { once: "course-view" });
  }, [router.isReady]);

  useEffect(() => { trackCoursePurchase(invoice); }, [invoice]);

  useEffect(() => {
    const savedOffer = window.localStorage.getItem("courseOfferTimer");

    if (savedOffer && Number(savedOffer) > 0) {
      setTimeLeft(Number(savedOffer));
    } else {
      setTimeLeft(PRICE_REVIEW_SECONDS);
      window.localStorage.setItem(
        "courseOfferTimer",
        String(PRICE_REVIEW_SECONDS),
      );
    }
  }, []);

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
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        const nextTime = current <= 0 ? 0 : current - 1;
        window.localStorage.setItem("courseOfferTimer", String(nextTime));
        return nextTime;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!invoice?.token || invoice.status !== "pending") return undefined;

    const poll = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/course-invoice?token=${invoice.token}`);
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
    if (accessInvoice?.status !== "paid") trackCourse("InitiateCheckout", { value: COURSE_PRICE, num_items: 1 }, { once: "course-checkout" });
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
          attribution: captureCourseAttribution(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create payment account.");
      }

      setInvoice(data.invoice);
      trackCourse("Lead", { value: COURSE_PRICE }, { once: "course-lead" });
      trackCourse("CoursePaymentAccountCreated", {}, { custom: true, once: "course-account" });
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
      const response = await fetch(`/api/course-invoice?token=${invoice.token}`);
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

    if (!question.trim()) return;

    setAsking(true);
    setAnswer("");
    setAskedQuestion(question.trim());

    try {
      const response = await fetch("/api/course-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();

      if (response.ok) trackCourse("CourseQuestionAnswered", {}, { custom: true });
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
        <title>COURSE | Joshspot Media</title>
      </Head>

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>
              Learn how to run TikTok, Facebook and Instagram ads that can help
              you sell online.
            </h1>
            <p>
              If you have been seeing people run ads and you keep wondering how
              they are doing it, this course will show you the process in a very
              simple way.
            </p>

            <div className={styles.heroIncludes}>
              <span>What you will get</span>
              <div className={styles.heroModuleGrid}>
                {modules.map((module) => (
                  <article key={module.title}>
                    <FiCheck aria-hidden="true" />
                    <div>
                      <strong>{module.title}</strong>
                      <p>{module.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.heroProof}>
            <img
              alt="Course folder showing TikTok Ads Manager training modules"
              src="/images/ads-course.jpg"
            />
          </div>
        </section>

        <section className={styles.reviewSection}>
          <div className={styles.sectionTitle}>
            <span>Course reviews</span>
            <h2>See reviews from people that have purchased our course already</h2>
          </div>

          <div className={styles.reviewGrid}>
            {reviewProofs.map((proof, index) => (
              <ReviewProof key={proof.src} proof={proof} index={index} />
            ))}
          </div>
        </section>

        <section className={styles.priceSection}>
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

        <section className={styles.priceTimer}>
          <div>
            <span>
              <FiClock aria-hidden="true" />
              Price will increase soon
            </span>
            <h2>
              Due to high demand for this course, we will increase the price in{" "}
              <strong>{formatTime(timeLeft)}</strong>
            </h2>
            <p>
              The price is currently {formatMoney(COURSE_PRICE)}. In the next
              2hrs 30 mins, we will increase the price to{" "}
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

        <section className={styles.questionCard} id="ask">
          <div>
            <span>Ask me a question first</span>
            <h2>Not sure if this course is for you?</h2>
          </div>
          <form onSubmit={askQuestion}>
            <input
              placeholder="Type your question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button disabled={asking} type="submit" aria-label="Send question">
              <FiSend aria-hidden="true" />
            </button>
          </form>
          {(answer || asking) && (
            <div className={styles.chatBox}>
              {askedQuestion && (
                <p className={styles.userBubble}>{askedQuestion}</p>
              )}
              <p className={styles.answerBubble}>
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
      </main>

      {(drawerOpen || previewPaid) && (
        <aside className={styles.drawerOverlay}>
          <section className={styles.drawer}>
            <button
              className={styles.closeDrawer}
              onClick={() => {
                setDrawerOpen(false);
                if (previewPaid) router.replace("/course", undefined, { shallow: true });
              }}
              type="button"
              aria-label="Close checkout"
            >
              <FiX aria-hidden="true" />
            </button>

            <div className={styles.drawerHeader}>
              {accessInvoice?.status !== "paid" && <span>Course checkout</span>}
              <h2>{accessInvoice?.status === "paid" ? "Payment confirmed!" : `Pay ${formatMoney(COURSE_PRICE)} by transfer`}</h2>
              {accessInvoice?.status !== "paid" && (
                <p>Enter your details first. We will generate a Paystack transfer account for this course payment.</p>
              )}
            </div>

            {previewPaid ? (
              <>
                <p className={styles.statusText} role="status">Local preview only. No payment was made. Email sending is simulated.</p>
                <CourseAccess invoice={previewInvoice} />
              </>
            ) : !invoice ? (
              <form className={styles.checkoutForm} onSubmit={startTransferPayment}>
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
                  <input type="email" autoComplete="email" maxLength={254} placeholder="you@example.com"
                    value={checkoutEmail} onChange={(event) => setCheckoutEmail(event.target.value)} />
                  <span>Get your course links and a reminder if you have trouble completing payment.</span>
                </label>
                {paymentError && <p className={styles.errorText}>{paymentError}</p>}
                <button disabled={loadingPayment} type="submit">
                  {loadingPayment ? "Generating account..." : "Pay with transfer"}
                </button>
              </form>
            ) : invoice.status === "paid" ? (
              <CourseAccess invoice={invoice} />
            ) : (
              <div className={styles.transferBox}>
                <p className={styles.statusText}>
                  Transfer the exact amount below. After payment, click I have paid. Once confirmed, your Telegram course buttons will appear here.
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
                {paymentError && <p className={styles.errorText}>{paymentError}</p>}
                <button
                  className={styles.confirmPaymentButton}
                  disabled={confirmingPayment}
                  onClick={confirmPayment}
                  type="button"
                >
                  {confirmingPayment ? (
                    <>
                      <FiLoader aria-hidden="true" className={styles.spinIcon} />
                      Confirming payment...
                    </>
                  ) : (
                    <>
                      <FiMessageCircle aria-hidden="true" />
                      I have paid
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

function CourseAccess({ invoice }) {
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
      setMessage("The video links has been sent to your email. Also check your spam folder too incase you can't find it in your inbox.");
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
      if (!response.ok) throw new Error(data.message || "The email did not send. Please try again.");
      setMessage(data.message);
      trackCourse("CourseLinksEmailed", {}, { custom: true });
    } catch (error) {
      setError(error.message || "The email did not send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.courseAccess}>
      <section className={styles.emailAccess} aria-labelledby="save-course-links">
        <h3 id="save-course-links">Enter your email below so i can send the courses link</h3>
        <p>After you enter your email below, i will send the courses link to you so you dont ever lose access to it and you can watch it anytime.</p>
        <form className={styles.checkoutForm} onSubmit={sendLinks}>
          <label htmlFor="course-email">Your email address</label>
          <input id="course-email" type="email" autoComplete="email" maxLength={254} required
            placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <button type="submit" disabled={sending}>{sending ? "Sending your links..." : "Send the links to me via email"}</button>
          {message && <p className={styles.statusText} role="status">{message}</p>}
          {error && <p className={styles.errorText} role="alert">{error}</p>}
        </form>
      </section>
      <section className={styles.telegramAccess} aria-labelledby="join-courses">
        <h3 id="join-courses">You can also, click the buttons below to access the courses directly</h3>
        {invoice.courses?.map((course) => (
          <a onClick={() => { if (!invoice.preview) trackCourse("CourseTelegramClick", { course_name: course.title }, { custom: true }); }} key={course.url} className={styles.telegramButton} href={course.url} target="_blank" rel="noopener noreferrer">
            <FiSend aria-hidden="true" /> Join {course.title}
          </a>
        ))}
      </section>
    </div>
  );
}

function CopyRow({ copied, label, onCopy, value }) {
  return (
    <div className={styles.copyRow}>
      <span>{label}</span>
      <strong>{value}</strong>
      <button onClick={() => onCopy(label, value)} type="button">
        {copied === label ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
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
