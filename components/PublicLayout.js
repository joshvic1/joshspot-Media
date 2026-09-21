import Link from "next/link";
import FullscreenMenu from "./FullscreenMenu";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiMenu } from "react-icons/fi";
import styles from "../styles/Public.module.css";
export default function PublicLayout({ children, hero }) {
const [menuOpen, setMenuOpen] = useState(false);
const page = useRef(null);
useEffect(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const animations = [];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animations.push(entry.target.animate(
        [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 450, easing: "cubic-bezier(.2,.7,.2,1)" }
      ));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  page.current.querySelectorAll(`.${styles.imageServiceCard}, .${styles.courseTile}, .${styles.sectionHeading}, .${styles.steps}, .${styles.footer}`).forEach(element => observer.observe(element));
  return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
}, []);
return <div ref={page} className={styles.shell}>
<header className={`${styles.siteHeader} ${hero ? styles.navyHeader : ""}`}>
  <div className={styles.navInner}>
    <Link href="/" className={styles.siteBrand} aria-label="Joshspot Media home">JoshspotMedia</Link>
    <button className={styles.menuToggle} aria-label="Open menu" aria-expanded={menuOpen} aria-controls={menuOpen ? "public-navigation" : undefined} onClick={() => setMenuOpen(true)}><FiMenu /></button>
  </div>
</header>
{menuOpen && <FullscreenMenu close={() => setMenuOpen(false)} />}
{hero && <div className={styles.fullBleedHero}>{hero}</div>}
<div className={styles.publicWorkspace}>
<div className={styles.content}>{children}
<footer className={styles.footer} id="contact"><div><strong>Let’s make your next move count.</strong><p>Practical marketing support, from Joshspot Media.</p></div><div><a href="https://wa.me/2348143017102" target="_blank" rel="noopener noreferrer">WhatsApp <FiArrowUpRight /></a><a href="https://instagram.com/joshspotmedia" target="_blank" rel="noopener noreferrer">Instagram <FiArrowUpRight /></a><a href="https://youtube.com/@joshspot_tv" target="_blank" rel="noopener noreferrer">YouTube <FiArrowUpRight /></a></div></footer></div></div></div>;
}
