import styles from "./Navbar.module.css";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          Joshspot<span>Media</span>
        </div>

        <ul className={styles.desktopMenu}>
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#services">Services</a>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>

        <button
          className={styles.cta}
          onClick={() => (window.location.href = "#services")}
        >
          Book Consultation
        </button>

        <div className={styles.mobileIcon} onClick={() => setMenuOpen(true)}>
          <FaBars />
        </div>
      </nav>

      {/* MOBILE MENU */}

      <div className={`${styles.mobileMenu} ${menuOpen ? styles.show : ""}`}>
        <div className={styles.close} onClick={() => setMenuOpen(false)}>
          <FaTimes />
        </div>

        <ul>
          <li>Home</li>
          <li>Services</li>
          <li>About</li>
          <li>Contact</li>
        </ul>

        <button className={styles.mobileCTA}>Book Consultation</button>
      </div>
    </>
  );
}
