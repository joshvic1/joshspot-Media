import styles from "../styles/TiktokSetup.module.css";
import { useState, useEffect } from "react";
import Script from "next/script";
import BookingModal from "../components/BookingModal/BookingModal";

const LIVE_MODE = false;
const PRICE = 20000;
const PIXEL_ID = "D7V46AJC77UCL5G1KVLG";

export default function TiktokSetup() {
  const [showBooking, setShowBooking] = useState(false);

  // ----------------------------------------------------
  // TikTok Pixel: THIS PAGE ONLY
  // ----------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ttq = window.ttqSetup;

    if (!ttq || typeof ttq.track !== "function") {
      return;
    }

    ttq.page();

    ttq.track("ViewContent", {
      content_id: "tiktok_ads_account_setup",
      content_name: "TikTok Ads Setup Page",
      content_type: "product",
      value: PRICE,
      currency: "NGN",
    });
  }, []);

  // ----------------------------------------------------
  // Purchase
  // ----------------------------------------------------
  const firePurchaseEvent = () => {
    if (
      typeof window === "undefined" ||
      !window.ttqSetup ||
      typeof window.ttqSetup.track !== "function"
    ) {
      return;
    }

    window.ttqSetup.track("Purchase", {
      content_id: "tiktok_ads_account_setup",
      content_name: "TikTok Ads Account Setup",
      content_type: "product",
      value: PRICE,
      currency: "NGN",
      contents: [
        {
          content_id: "tiktok_ads_account_setup",
          content_name: "TikTok Ads Account Setup",
          content_type: "product",
          quantity: 1,
          price: PRICE,
        },
      ],
      ...(LIVE_MODE
        ? {}
        : {
            test_event_code: "TEST123",
          }),
    });
  };

  // ----------------------------------------------------
  // WhatsApp / Registration
  // ----------------------------------------------------
  const fireRegistrationEvent = () => {
    if (
      typeof window === "undefined" ||
      !window.ttqSetup ||
      typeof window.ttqSetup.track !== "function"
    ) {
      return;
    }

    window.ttqSetup.track("CompleteRegistration", {
      content_id: "tiktok_ads_account_setup",
      content_name: "TikTok Ads Setup WhatsApp Inquiry",
      content_type: "product",
      value: PRICE,
      currency: "NGN",
      ...(LIVE_MODE
        ? {}
        : {
            test_event_code: "TEST49729",
          }),
    });
  };

  // ----------------------------------------------------
  // Pay button
  // ----------------------------------------------------
  const handlePay = () => {
    if (
      typeof window !== "undefined" &&
      window.ttqSetup &&
      typeof window.ttqSetup.track === "function"
    ) {
      window.ttqSetup.track("InitiateCheckout", {
        content_id: "tiktok_ads_account_setup",
        content_name: "TikTok Ads Account Setup",
        content_type: "product",
        value: PRICE,
        currency: "NGN",
      });
    }

    setShowBooking(true);
  };

  // ----------------------------------------------------
  // WhatsApp button
  // ----------------------------------------------------
  const handleWhatsapp = () => {
    fireRegistrationEvent();

    window.open("https://mytiklink.com/r/vshzs8", "_blank");
  };

  return (
    <>
      {/* ==================================================
          TIKTOK PIXEL - THIS PAGE ONLY
          ================================================== */}
      <Script
        id="tiktok-pixel-tiktok-setup"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject = t;

              var ttq = w[t] = w[t] || [];

              ttq.methods = [
                "page",
                "track",
                "identify",
                "instances",
                "debug",
                "on",
                "off",
                "once",
                "ready",
                "alias",
                "group",
                "enableCookie",
                "disableCookie"
              ];

              ttq.setAndDefer = function (t, e) {
                t[e] = function () {
                  t.push(
                    [e].concat(
                      Array.prototype.slice.call(arguments, 0)
                    )
                  );
                };
              };

              for (var i = 0; i < ttq.methods.length; i++) {
                ttq.setAndDefer(ttq, ttq.methods[i]);
              }

              ttq.instance = function (t) {
                for (
                  var e = ttq._i[t] || [],
                      n = 0;
                  n < ttq.methods.length;
                  n++
                ) {
                  ttq.setAndDefer(e, ttq.methods[n]);
                }

                return e;
              };

              ttq.load = function (e, n) {
                var i =
                  "https://analytics.tiktok.com/i18n/pixel/events.js";

                ttq._i = ttq._i || {};
                ttq._i[e] = [];
                ttq._i[e]._u = i;
                ttq._t = ttq._t || {};
                ttq._t[e] = +new Date;
                ttq._o = ttq._o || {};
                ttq._o[e] = n || {};

                var o = document.createElement("script");

                o.type = "text/javascript";
                o.async = true;
                o.src =
                  i +
                  "?sdkid=" +
                  e +
                  "&lib=" +
                  t;

                var a =
                  document.getElementsByTagName("script")[0];

                a.parentNode.insertBefore(o, a);
              };

              ttq.load("${PIXEL_ID}");
              ttq.page();

            }(
              window,
              document,
              "ttqSetup"
            );
          `,
        }}
      />

      {/* ==================================================
          PAGE
          ================================================== */}
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
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
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

        {/* BOOKING MODAL */}
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
    </>
  );
}
