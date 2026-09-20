import styles from "./Modal.module.css";
import { FaTimes } from "react-icons/fa";
import { useEffect, useRef } from "react";
import Image from "next/image";

export default function Modal({ children, closeModal, compact = false, service }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return (
    <dialog ref={dialog} className={styles.overlay} aria-label="Service details and booking" onCancel={closeModal} onClick={event => { if (event.target === event.currentTarget) closeModal(); }}>
      <div className={`${styles.modal} ${compact ? styles.compactModal : ""} ${service ? styles.serviceModal : ""}`} data-tone={service?.id}>
        <button className={styles.close} onClick={closeModal} aria-label="Close dialog" type="button">
          <FaTimes />
        </button>

        {service && <div className={styles.serviceImage}><Image src={service.image} alt={service.title} fill sizes="440px" /></div>}
        {children}
      </div>
    </dialog>
  );
}
