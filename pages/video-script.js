import Head from "next/head";
import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiCopy,
  FiEdit3,
  FiLoader,
  FiMessageCircle,
  FiMic,
  FiPlayCircle,
  FiType,
  FiX,
} from "react-icons/fi";
import styles from "../styles/VideoScript.module.css";

const SCRIPT_PRICE = 20000;
const WHATSAPP_REDIRECT =
  "https://wa.me/2348143017102?text=I%20just%20paid%20for%20your%20video%20script";

const deliverables = [
  {
    title: "Talking head or voiceover script",
    text: "I will write what you should say in the video, line by line, so you are not just staring at your camera confused.",
    icon: FiMic,
  },
  {
    title: "Caption for the post",
    text: "You will get a caption that explains the offer properly and makes people know the next step to take.",
    icon: FiEdit3,
  },
  {
    title: "Hashtags to use",
    text: "I will add hashtags that fit the kind of content and business you are posting about.",
    icon: FiPlayCircle,
  },
  {
    title: "Text to add on the video",
    text: "You will also get the short bold text to place on the video so people can understand the point quickly.",
    icon: FiType,
  },
];

const angles = [
  "For product sellers that want videos that can explain their offer better.",
  "For service providers that know what they do, but do not know how to say it in a way people care about.",
  "For business owners that want to post, run ads or make reels without wasting time thinking of what to say.",
];

const formatMoney = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

export default function VideoScriptPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [whatsapp, setWhatsapp] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!invoice?.token || invoice.status !== "pending") return undefined;

    const poll = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/script-invoice?token=${invoice.token}`);
        const data = await response.json();

        if (response.ok) {
          setInvoice(data);

          if (data.status === "paid") {
            window.clearInterval(poll);
            window.location.href = WHATSAPP_REDIRECT;
          }
        }
      } catch (error) {
        console.log("SCRIPT PAYMENT POLL ERROR:", error);
      }
    }, 5000);

    return () => window.clearInterval(poll);
  }, [invoice?.token, invoice?.status]);

  const openCheckout = () => {
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
      const response = await fetch("/api/script-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          businessName,
          whatsapp: fullWhatsapp,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create payment account.");
      }

      setInvoice(data.invoice);
    } catch (error) {
      setPaymentError(error.message || "Unable to create payment account.");
    } finally {
      setLoadingPayment(false);
    }
  };

  const confirmPayment = async () => {
    if (!invoice?.token) return;

    setConfirmingPayment(true);
    setPaymentError("");

    try {
      const response = await fetch(`/api/script-invoice?token=${invoice.token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm payment now.");
      }

      setInvoice(data);

      if (data.status === "paid") {
        window.location.href = WHATSAPP_REDIRECT;
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
    window.setTimeout(() => setCopied(""), 1300);
  };

  return (
    <>
      <Head>
        <title>Video Script | Joshspot Media</title>
      </Head>

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Video script package</span>
            <h1>
              Let me write the exact video script, caption and hashtags for your
              next business video.
            </h1>
            <p>
              If you know you need to post or run ads, but the problem is always
              “what exactly should I say?”, this is for you. I will help you
              package the message so your video is clear, direct and easier for
              your audience to understand.
            </p>

            <div className={styles.heroActions}>
              <button onClick={openCheckout} type="button">
                Pay now ({formatMoney(SCRIPT_PRICE)})
                <FiArrowRight aria-hidden="true" />
              </button>
              <a href="#details">See what you get</a>
            </div>
          </div>

          <aside className={styles.priceCard}>
            <span>Everything for</span>
            <strong>{formatMoney(SCRIPT_PRICE)}</strong>
            <p>
              You pay once, then after payment is confirmed, you will be sent to
              WhatsApp so I can collect what I need and work on your script.
            </p>
            <button onClick={openCheckout} type="button">
              Get my script
            </button>
          </aside>
        </section>

        <section className={styles.valueGrid} id="details">
          {deliverables.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title}>
                <Icon aria-hidden="true" />
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className={styles.explainSection}>
          <div>
            <span>Who this is for</span>
            <h2>You do not need to overthink your next video again.</h2>
          </div>
          <div className={styles.angleList}>
            {angles.map((angle) => (
              <p key={angle}>
                <FiCheck aria-hidden="true" />
                {angle}
              </p>
            ))}
          </div>
        </section>

        <section className={styles.sampleBox}>
          <span>Simple flow</span>
          <h2>What you will receive from me</h2>
          <div>
            <p>1. The video hook: what to say first so people stop and listen.</p>
            <p>2. The main script: the message you should say in the video.</p>
            <p>3. The caption: what to write under the video.</p>
            <p>4. The hashtags and on-screen text to add to the video.</p>
          </div>
        </section>

        <section className={styles.finalCta}>
          <h2>Ready? Let me write your video script.</h2>
          <p>
            Pay {formatMoney(SCRIPT_PRICE)} now, confirm payment, and you will
            be redirected to WhatsApp with the message already filled.
          </p>
          <button onClick={openCheckout} type="button">
            Pay now ({formatMoney(SCRIPT_PRICE)})
          </button>
        </section>
      </main>

      {drawerOpen && (
        <aside className={styles.drawerOverlay}>
          <section className={styles.drawer}>
            <button
              className={styles.closeDrawer}
              onClick={() => setDrawerOpen(false)}
              type="button"
              aria-label="Close checkout"
            >
              <FiX aria-hidden="true" />
            </button>

            <div className={styles.drawerHeader}>
              <span>Checkout</span>
              <h2>Pay {formatMoney(SCRIPT_PRICE)} by transfer</h2>
              <p>
                Enter your details first. We will generate a Paystack transfer
                account for your video script payment.
              </p>
            </div>

            {!invoice ? (
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
                  Business name <small>optional</small>
                  <input
                    placeholder="Your business name"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
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
                {paymentError && <p className={styles.errorText}>{paymentError}</p>}
                <button disabled={loadingPayment} type="submit">
                  {loadingPayment ? "Generating account..." : "Pay with transfer"}
                </button>
              </form>
            ) : (
              <div className={styles.transferBox}>
                <p className={styles.statusText}>
                  {invoice.status === "paid"
                    ? "Payment confirmed. Redirecting..."
                    : "Transfer the exact amount below. After payment, click I have paid so we can confirm it before sending you to WhatsApp."}
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
