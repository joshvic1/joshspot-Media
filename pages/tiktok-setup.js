import styles from "../styles/TiktokSetup.module.css";
import { useState, useEffect } from "react";
import BookingModal from "../components/BookingModal/BookingModal";

const LIVE_MODE = false;
const PRICE = 20000;

export default function TiktokSetup() {
  const [showBooking, setShowBooking] = useState(false);
  const firePurchaseEvent = () => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track("Purchase", {
        value: PRICE,
        currency: "NGN",
        contents: [
          {
            content_name: "TikTok Ads Account Setup",
            content_type: "service",
            price: PRICE,
          },
        ],
        test_event_code: LIVE_MODE ? undefined : "TEST123",
      });
    }
  };

  useEffect(() => {
    if (window.ttq) {
      window.ttq.track("ViewContent", {
        content_name: "TikTok Ads Setup Page",
      });
    }
  }, []);

  const fireRegistrationEvent = () => {
    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track("CompleteRegistration", {
        content_name: "TikTok Ads Setup WhatsApp Inquiry",
        test_event_code: LIVE_MODE ? undefined : "TEST49729",
      });
    }
  };

  const handlePay = () => {
    if (window.ttq) {
      window.ttq.track("InitiateCheckout");
    }
    setShowBooking(true);
  };

  const handleWhatsapp = () => {
    fireRegistrationEvent();
    window.open("https://mytiklink.com/r/ehr3bg", "_blank");
  };

  return (
    <div className={styles.page}>
      {/* HERO */}

      <section className={styles.hero}>
        <div className={styles.videoWrapper}>
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/rZsBk0lnqu0?si=5Gy4H1-8fSTCJ0cd"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
        <h1 className={styles.title}>
          Let me help you set up your TikTok Ads Manager account
          <span> Properly</span>
        </h1>

        <p className={styles.subtitle}>
          For just ₦20,000, I will personally create and configure your TikTok
          Ads account so you can start running profitable ads immediately.
        </p>

        <div className={styles.heroButtons}>
          <button className={styles.primaryBtn} onClick={handlePay}>
            Pay Now (₦20,000)
          </button>

          <button className={styles.secondaryBtn} onClick={handleWhatsapp}>
            Chat on WhatsApp
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <h2>What You Will Get</h2>

        <div className={styles.grid}>
          <div className={styles.feature}>
            <h3>Ads Account Creation</h3>
            <p>Your TikTok Ads account will be professionally created.</p>
          </div>

          <div className={styles.feature}>
            <h3>Verification Setup</h3>
            <p>Proper account verification for smooth ad approval.</p>
          </div>

          <div className={styles.feature}>
            <h3>Payment Configuration</h3>
            <p>Your ad account payment system will be fully configured.</p>
          </div>

          <div className={styles.feature}>
            <h3>TikTok Pixel Setup</h3>
            <p>Pixel installation to track conversions properly.</p>
          </div>

          <div className={styles.feature}>
            <h3>Landing Page Connection</h3>
            <p>Your website or landing page will be connected correctly.</p>
          </div>

          <div className={styles.feature}>
            <h3>First Campaign Setup</h3>
            <p>Your first TikTok campaign will be properly configured.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={styles.cta}>
        <h2>Ready To Start Running TikTok Ads?</h2>

        <p>
          Stop struggling with account setup. Let me handle everything so you
          can focus on growing your business.
        </p>

        <div className={styles.ctaButtons}>
          <button className={styles.primaryBtn} onClick={handlePay}>
            Pay ₦20,000 Now
          </button>

          <button className={styles.secondaryBtn} onClick={handleWhatsapp}>
            Chat me On WhatsApp
          </button>
        </div>
      </section>
      {showBooking && (
        <BookingModal
          service={{
            title: "TikTok Ads Account Setup",
            price: PRICE,
          }}
          closeModal={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
