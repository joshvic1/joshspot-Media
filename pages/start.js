import styles from "../styles/Start.module.css";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Start() {
  const router = useRouter();

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Choose What You Want To Do</h1>

        <div className={styles.grids}>
          {/* FREE OPTION */}
          <div className={styles.grid}>
            {/* FREE OPTION */}
            <Link
              href="https://www.youtube.com/watch?v=cPQL5p6CXs4&list=PLiF2fraj3mTcolRwvw4QsPTDO_4xWVSs1&pp=sAgC"
              target="_blank"
              className={styles.cardLink}
            >
              <div className={styles.card}>
                <h2>Learn For Free</h2>

                <p>
                  Watch my free TikTok Ads tutorial and learn how to run
                  profitable ads for your business.
                </p>

                <button className={styles.primary}>
                  Watch Free Tutorial →
                </button>
              </div>
            </Link>

            {/* WORK WITH ME */}
            <Link
              href="https://joshspotmedia.com/#services"
              className={styles.cardLink}
            >
              <div className={styles.cardHighlight}>
                <h2>Work With Me</h2>

                <p>
                  Book a consultation or hire me to run your ads and grow your
                  business with proven strategies.
                </p>

                <button className={styles.gold}>Book Consultation →</button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
