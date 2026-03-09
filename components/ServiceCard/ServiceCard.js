import { useState } from "react";
import styles from "./ServiceCard.module.css";
import Image from "next/image";
import ViewDetailsModal from "../ViewDetailsModal/ViewDetailsModal";
import BookingModal from "../BookingModal/BookingModal";

export default function ServiceCard({ service, number }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  };
  const truncateDescription = (text) => {
    const words = text.split(" ");
    if (words.length <= 11) return text;
    return words.slice(0, 11).join(" ") + "...";
  };
  return (
    <>
      <div className={styles.card} onMouseMove={handleMouseMove}>
        <Image
          src={service.image}
          alt={service.title}
          fill
          className={styles.image}
        />

        <div className={styles.overlay}></div>

        <div className={styles.number}>{number}</div>

        <div className={styles.content}>
          <h3>{service.title}</h3>

          <p>{truncateDescription(service.description)}</p>

          <div className={styles.bottom}>
            <span className={styles.price}>
              {service.dynamicPricing
                ? service.priceRange
                : `₦${service.price.toLocaleString()}`}
            </span>
          </div>
          <div className={styles.bottom}>
            <div className={styles.buttons}>
              <button
                className={styles.details}
                onClick={() => setShowDetails(true)}
              >
                Details
              </button>

              <button
                className={styles.book}
                onClick={() => setShowBooking(true)}
              >
                Book Now →
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <ViewDetailsModal
          service={service}
          closeModal={() => setShowDetails(false)}
          openBooking={() => setShowBooking(true)}
        />
      )}

      {showBooking && (
        <BookingModal
          service={service}
          closeModal={() => setShowBooking(false)}
        />
      )}
    </>
  );
}
