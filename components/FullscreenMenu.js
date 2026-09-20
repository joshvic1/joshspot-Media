import { useEffect, useRef } from "react";
import Link from "next/link";
import { FiX, FiArrowUpRight } from "react-icons/fi";
import styles from "../styles/Public.module.css";

const links = [["Home", "/"], ["Services", "/#services"], ["Learn", "/#learn"], ["Contact", "/#contact"]];

export default function FullscreenMenu({ close }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => { element.close(); document.body.style.overflow = previous; };
  }, []);
  return (
    <dialog ref={dialog} id="public-navigation" className={styles.fullscreenMenu} onCancel={close} aria-label="Navigation menu">
      <div className={styles.menuScreenInner}>
        <div className={styles.menuScreenTop}>
          <Link href="/" onClick={close} className={styles.menuWordmark}>JoshspotMedia</Link>
          <button type="button" onClick={close} aria-label="Close menu">Close <FiX /></button>
        </div>
        <nav aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={close}><span>{label}</span><FiArrowUpRight /></Link>)}
        </nav>
        <div className={styles.menuScreenBottom}><span>Joshspot Media</span><a href="https://wa.me/2348143017102" target="_blank" rel="noopener noreferrer">Let’s talk <FiArrowUpRight /></a></div>
      </div>
    </dialog>
  );
}
