import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy, FiX, FiChevronDown } from "react-icons/fi";
import { quickReplies } from "../config/quickReplies.mjs";
import { copyMessage } from "../utils/copyMessage.mjs";
import styles from "../styles/AdsCalculator.module.css";

export default function QuickReplies({ onClose }) {
  const dialog = useRef(null);
  const timers = useRef({});
  const [copied, setCopied] = useState({});
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current, previous = document.body.style.overflow;
    const trigger = document.activeElement;
    const activeTimers = timers.current;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      Object.values(activeTimers).forEach(clearTimeout);
      element.close();
      document.body.style.overflow = previous;
      trigger?.focus();
    };
  }, []);
  async function copy(reply) {
    try {
      await copyMessage(reply.message);
      setError("");
      setCopied(previous => ({...previous,[reply.id]:true}));
      clearTimeout(timers.current[reply.id]);
      timers.current[reply.id] = setTimeout(() => setCopied(previous => ({...previous,[reply.id]:false})),2000);
    } catch {
      setError("Copy is unavailable. Select the message text and copy it manually.");
    }
  }
  return <dialog className={styles.quickDialog} ref={dialog} onCancel={onClose} aria-labelledby="quick-replies-title" onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>
    <header className={styles.quickHeader}><div><h2 id="quick-replies-title">Quick Replies</h2><p>Ready for your next conversation.</p></div><button autoFocus onClick={onClose} aria-label="Close Quick Replies"><FiX /></button></header>
    <div className={styles.quickBody}>{quickReplies.map(reply => <details name="quick-replies" key={reply.id} className={styles.quickReply}><summary>{reply.title}<FiChevronDown /></summary><pre>{reply.message}</pre><button className={styles.primary} onClick={() => copy(reply)} aria-label={"Copy " + reply.title}>{copied[reply.id] ? <FiCheck /> : <FiCopy />}<span aria-live="polite">{copied[reply.id] ? "Copied ✓" : "Copy message"}</span></button></details>)}<p role="status" className={styles.quickError}>{error}</p></div>
  </dialog>;
}


