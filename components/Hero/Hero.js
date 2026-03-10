import { useEffect, useState } from "react";
import styles from "./Hero.module.css";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Hero() {
  const texts = [
    "Work With JoshspotMedia",
    "Book a Consultation",
    "Fix Your Ad Account",
    "Hire us to run Your Ads",
  ];
  const router = useRouter();
  const [currentText, setCurrentText] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentText((prev) => (prev + 1) % texts.length);
        setFade(true);
      }, 400);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        {/* LEFT SIDE */}
        <div className={styles.textArea}>
          <div className={styles.badge}>
            <span>HELLO!</span> WELCOME
          </div>

          <h1
            className={`${styles.heading} ${
              fade ? styles.fadeIn : styles.fadeOut
            }`}
          >
            {texts[currentText]}
          </h1>

          <p className={styles.subtext}>
            Professional TikTok ads, Meta ads, brand growth, and marketing
            strategy designed to help businesses scale faster and fix ad account
            issues quickly.
          </p>

          <div className={styles.buttons}>
            <button
              className={styles.primary}
              onClick={() => router.push("#services")}
            >
              Book Consultation
            </button>

            <button
              className={styles.secondary}
              onClick={() => router.push("#services")}
            >
              View Services →
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className={styles.imageArea}>
          <div className={styles.imageCard}>
            <Image
              src="/images/joshua.png"
              alt="Joshspot Media"
              fill
              className={styles.image}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
