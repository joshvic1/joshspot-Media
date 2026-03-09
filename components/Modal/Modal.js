import styles from "./Modal.module.css";
import { FaTimes } from "react-icons/fa";

export default function Modal({ children, closeModal }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={closeModal}>
          <FaTimes />
        </button>

        {children}
      </div>
    </div>
  );
}
