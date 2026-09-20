import Image from "next/image";
import { useEffect, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import styles from "../styles/Public.module.css";

const headlines = [
  ["Launch better ads.", "With Joshspot Media."],
  ["Fix your ad account.", "Get back to business."],
  ["Master TikTok & Meta.", "Build your own skills."],
  ["Plan your next move.", "With expert guidance."],
];

export default function HomeHero() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    function update() {
      clearInterval(timer);
      if (!preference.matches) {
        timer = setInterval(() => setActive(value => (value + 1) % headlines.length), 4000);
      }
    }
    update();
    preference.addEventListener("change", update);
    return () => { clearInterval(timer); preference.removeEventListener("change", update); };
  }, []);

  return (
    <section className={styles.refinedHero} aria-labelledby="hero-title">
      <div className={styles.refinedCopy}>
        <h1 id="hero-title" className={styles.rotatingHeadline}>
          <span key={active} className={styles.currentHeadline}>
            {headlines[active][0]}<em>{headlines[active][1]}</em>
          </span>
        </h1>
        <p>Trying to get your ads right? Let Josh help you figure out how your business can grow with ads.</p>
        <div className={styles.heroActions}>
          <a className={styles.limeButton} href="#services">Book a service <FiArrowUpRight /></a>
          <a href="#learn" className={styles.heroLink}>Watch free training <FiArrowUpRight /></a>
        </div>
        <div className={styles.headlineControls}>
          {headlines.map(([first], index) => <button key={first} type="button" aria-label={"Show headline: " + first} aria-pressed={active === index} onClick={() => setActive(index)}><span /></button>)}
        </div>
      </div>
      <div className={styles.refinedPortrait}>
        <Image src="/images/joshua.png" alt="Josh of Joshspot Media" fill priority sizes="(max-width:650px) 76px, (max-width:950px) 200px, 260px" />
      </div>
    </section>
  );
}
