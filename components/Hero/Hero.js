import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./Hero.module.css";

export default function Hero() {
  const texts = [
    "Launch Better Ads With Joshspot Media",
    "Fix Your Ad Account Fast",
    "Book Premium Marketing Support",
    "Learn TikTok And Meta Ads",
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
  }, [texts.length]);

  return (
    <section className={styles.hero} id="home">
      <div className={styles.glowOne}></div>
      <div className={styles.glowTwo}></div>

      <div className={styles.container}>
        <div className={styles.textArea}>
          <div className={styles.badge}>
            <span>Premium Ads Growth</span> TikTok • Meta • Strategy
          </div>

          <h1
            className={`${styles.heading} ${fade ? styles.fadeIn : styles.fadeOut}`}
          >
            {texts[currentText]}
          </h1>

          <p className={styles.subtext}>
            Book expert consultations, ads setup, account audits, and private
            training for TikTok and Meta. Built for business owners who want
            clean direction, sharper campaigns, and faster execution.
          </p>

          <div className={styles.buttons}>
            <button
              className={styles.primary}
              onClick={() => router.push("#services")}
            >
              Explore Services
            </button>

            <button
              className={styles.secondary}
              onClick={() => router.push("#services")}
            >
              Watch Free Training
            </button>
          </div>
        </div>

        <div className={styles.imageArea}>
          <div className={styles.imageCard}>
            <Image
              src="/images/joshua.png"
              alt="Joshspot Media"
              fill
              className={styles.image}
              priority
            />
            <div className={styles.imageBadge}>
              <span>Live support</span>
              <strong>Strategy • Setup • Training</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
