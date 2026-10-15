import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { FiMessageCircle, FiArrowLeft } from "react-icons/fi";
import styles from "../styles/CourseExitHelp.module.css";

export default function CourseExitHelp({ active, drawerOpen, whatsappCourse, onClose, children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [visible, setVisible] = useState(false);
  const dialog = useRef(null);
  const drawer = useRef(drawerOpen);
  drawer.current = drawerOpen;
  const pagePromptSeen = useRef(false);
  const leaving = useRef(false);
  const [scope, setScope] = useState("payment");
  const leavePage = () => {
    setVisible(false);
    leaving.current = true;
    router.beforePopState(() => true);
    // Skip our single same-page guard when it is still on top.
    window.history.go(window.history.state?.coursePaymentGuard ? -2 : -1);
  };
  const close = useRef(onClose);
  close.current = onClose;
  const showing = useRef(false);
  const guarded = useRef(false);
  const cleanupTimer = useRef(null);
  const requestClose = () => { if (active) { setScope("payment"); setVisible(true); } else close.current(); };
  useEffect(() => {
    if (!active) { setVisible(false); return; }
    if (!router.isReady) return;
    clearTimeout(cleanupTimer.current);
    const push = () => {
      window.history.pushState({ ...window.history.state, coursePaymentGuard: true }, "", window.location.href);
      guarded.current = true;
    };
    if (!guarded.current || !window.history.state?.coursePaymentGuard) push();
    // Next may replace the current state while completing initial hydration.
    // Restore only the marker, without adding another history entry.
    const restoreMarker = () => {
      if (guarded.current && !leaving.current && !window.history.state?.coursePaymentGuard)
        window.history.replaceState({ ...window.history.state, coursePaymentGuard: true }, "", window.location.href);
    };
    router.events.on("routeChangeComplete", restoreMarker);
    router.beforePopState(() => false);
    const handleBack = () => {
      if (leaving.current) return;
      guarded.current = false;
      if (drawer.current) {
        push();
        if (showing.current) { setVisible(false); close.current(); return; }
        setScope("payment");
        setVisible(true);
        return;
      }
      if (pagePromptSeen.current) { leavePage(); return; }
      pagePromptSeen.current = true;
      push();
      setScope("page");
      setVisible(true);
    };
    window.addEventListener("popstate", handleBack);
    return () => {
      window.removeEventListener("popstate", handleBack);
      router.events.off("routeChangeComplete", restoreMarker);
      router.beforePopState(() => true);
      cleanupTimer.current = setTimeout(() => {
        if (!leaving.current && guarded.current && window.history.state?.coursePaymentGuard) {
          guarded.current = false;
          window.history.back();
        }
      }, 0);
    };
  }, [active, router, router.isReady]);
  useEffect(() => {
    showing.current = visible;
    if (visible && !dialog.current?.open) dialog.current?.showModal();
    else if (!visible && dialog.current?.open) dialog.current.close();
  }, [visible]);
  const product = whatsappCourse ? "WhatsApp Status adverts course" : "TikTok, Facebook and Instagram ads course";
  const link = `https://wa.me/2347072571740?text=${encodeURIComponent(`Hi Josh, I want to buy the ${product}, but I need help with payment.`)}`;
  return <>
    {children(requestClose)}
    {mounted && createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby="payment-help-title" onCancel={event => { event.preventDefault(); setVisible(false); }}>
      <div className={styles.icon}><FiMessageCircle /></div>
      <h2 id="payment-help-title">{scope === "page" ? "Have a question before you go?" : "Having trouble paying?"}</h2>
      <p>Have a question about the {product}? Message Josh for help before you go.</p>
      <a className={styles.whatsapp} href={link} target="_blank" rel="noopener noreferrer"><FiMessageCircle /> Message Josh on WhatsApp</a>
      <button className={styles.continue} type="button" onClick={() => setVisible(false)}><FiArrowLeft /> {scope === "page" ? "Stay on this page" : "Continue payment"}</button>
      <button className={styles.leave} type="button" onClick={() => { if (scope === "page") leavePage(); else { setVisible(false); close.current(); } }}>{scope === "page" ? "Leave page" : "Leave payment"}</button>
    </dialog>, document.body)}
  </>;
}
