import Modal from "../Modal/Modal";
import styles from "./ViewDetailsModal.module.css";

export default function ViewDetailsModal({ service, closeModal, openBooking }) {
  return (
    <Modal closeModal={closeModal}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h2 className={styles.title}>{service.title}</h2>

          <div className={styles.desc}>{service.description}</div>

          <div className={styles.price}>
            {service.dynamicPricing
              ? service.priceRange
              : `₦${service.price.toLocaleString()}`}
          </div>

          <button
            className={styles.book}
            onClick={() => {
              closeModal();
              openBooking();
            }}
          >
            Book Service →
          </button>
        </div>
      </div>
    </Modal>
  );
}
