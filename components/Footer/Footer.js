import styles from "./Footer.module.css";
import { FaTiktok, FaYoutube, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* BRAND */}
        <div className={styles.brand}>
          <h3>JoshspotMedia</h3>

          <p>
            Helping businesses grow with TikTok Ads, Meta Ads and strategic
            marketing systems designed for real results.
          </p>
        </div>

        {/* SOCIAL */}
        <div className={styles.contact}>
          <h4>Connect With Us</h4>

          <div className={styles.socials}>
            <a
              href="https://tiktok.com/@joshspotmedia"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTiktok />
            </a>

            <a
              href="https://youtube.com/@joshspot_tv"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaYoutube />
            </a>

            <a
              href="https://instagram.com/joshspotmedia"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram />
            </a>

            <a
              href="https://wa.me/234XXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        © {new Date().getFullYear()} JoshspotMedia. All rights reserved.
      </div>
    </footer>
  );
}
