import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { FiMessageCircle, FiArrowLeft } from "react-icons/fi";
import styles from "../styles/CourseExitHelp.module.css";

export default function CourseExitHelp({ active, whatsappCourse, onClose, children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [visible, setVisible] = useState(false);
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const showing = useRef(false);
  const guarded = useRef(false);
  const cleanupTimer = useRef(null);
  const requestClose = () => active ? setVisible(true) : close.current();
  useEffect(() => {
    if (!active) { setVisible(false); return; }
    clearTimeout(cleanupTimer.current);
    const push = () => {
      window.history.pushState({ ...window.history.state, coursePaymentGuard: true }, "", window.location.href);
      guarded.current = true;
    };
    if (!guarded.current || !window.history.state?.coursePaymentGuard) push();
    router.beforePopState(() => false);
    const handleBack = () => {
      guarded.current = false;
      // A second Back closes checkout instead of trapping the customer.
      if (showing.current) { setVisible(false); close.current(); return false; }
      push();
      setVisible(true);
    };
    window.addEventListener("popstate", handleBack);
    return () => {
      window.removeEventListener("popstate", handleBack);
      router.beforePopState(() => true);
      cleanupTimer.current = setTimeout(() => {
        if (guarded.current && window.history.state?.coursePaymentGuard) {
          guarded.current = false;
          window.history.back();
        }
      }, 0);
    };
  }, [active, router]);
  useEffect(() => {
    showing.current = visible;
    if (visible && !dialog.current?.open) dialog.current?.showModal();
    else if (!visible && dialog.current?.open) dialog.current.close();
  }, [visible]);
  const product = whatsappCourse ? "WhatsApp Status adverts course" : "TikTok, Facebook and Instagram ads course";
  const link = `https://wa.me/2348143017102?text=${encodeURIComponent(`Hi Josh, I want to buy the ${product}, but I need help with payment.`)}`;
  return <>
    {children(requestClose)}
    {mounted && createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby="payment-help-title" onCancel={event => { event.preventDefault(); setVisible(false); }}>
      <div className={styles.icon}><FiMessageCircle /></div>
      <h2 id="payment-help-title">Having trouble paying?</h2>
      <p>Have a question about the {product}? Message Josh for help before you go.</p>
      <a className={styles.whatsapp} href={link} target="_blank" rel="noopener noreferrer"><FiMessageCircle /> Message Josh on WhatsApp</a>
      <button className={styles.continue} type="button" onClick={() => setVisible(false)}><FiArrowLeft /> Continue payment</button>
      <button className={styles.leave} type="button" onClick={() => { setVisible(false); close.current(); }}>Leave payment</button>
    </dialog>, document.body)}
  </>;
}
