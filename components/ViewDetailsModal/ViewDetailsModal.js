import Modal from "../Modal/Modal";
import styles from "./ViewDetailsModal.module.css";

export default function ViewDetailsModal({ service, closeModal, openBooking }) {
  const price =
    service.priceLabel || service.priceRange || `₦${service.price.toLocaleString()}`;

  return (
    <Modal closeModal={closeModal}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <span className={styles.eyebrow}>{service.eyebrow}</span>
          <h2 className={styles.title}>{service.title}</h2>

          <div className={styles.desc}>{service.description}</div>

          {service.highlights?.length > 0 && (
            <ul className={styles.highlights}>
              {service.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <div className={styles.price}>{price}</div>

          <button
            className={styles.book}
            onClick={() => {
              closeModal();
              openBooking();
            }}
          >
            {service.ctaLabel || "Book Service →"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
