import { useState } from "react";
import Image from "next/image";
import BookingModal from "../BookingModal/BookingModal";
import ViewDetailsModal from "../ViewDetailsModal/ViewDetailsModal";
import styles from "./ServiceCard.module.css";

export default function ServiceCard({ service, number }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const Icon = service.icon;

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    card.style.setProperty("--x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const truncateDescription = (text) => {
    const words = text.split(" ");
    if (words.length <= 18) return text;
    return `${words.slice(0, 18).join(" ")}...`;
  };

  const price =
    service.priceLabel || service.priceRange || `₦${service.price.toLocaleString()}`;
  const actionLabel = service.ctaLabel || "Book Now";

  const openService = () => {
    if (service.externalLink) {
      window.open(service.externalLink, "_blank", "noopener,noreferrer");
      return;
    }

    setShowBooking(true);
  };

  return (
    <>
      <div
        className={`${styles.card} ${service.featuredResource ? styles.resourceCard : ""}`}
        onMouseMove={handleMouseMove}
      >
        <div className={styles.imageWrap}>
          <Image
            src={service.image}
            alt={service.title}
            fill
            className={styles.image}
          />
        </div>

        <div className={styles.topRow}>
          <span className={styles.number}>{String(number).padStart(2, "0")}</span>
          <span className={styles.eyebrow}>{service.eyebrow}</span>
        </div>

        <div className={styles.icon}>{Icon && <Icon />}</div>

        <div className={styles.content}>
          <h3>{service.title}</h3>
          <p>{truncateDescription(service.description)}</p>

          <ul className={styles.highlights}>
            {service.highlights?.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className={styles.bottom}>
            <span className={styles.price}>{price}</span>
            <div className={styles.buttons}>
              <button className={styles.details} onClick={() => setShowDetails(true)}>
                Details
              </button>
              <button className={styles.book} onClick={openService}>
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <ViewDetailsModal
          service={service}
          closeModal={() => setShowDetails(false)}
          openBooking={openService}
        />
      )}

      {showBooking && (
        <BookingModal service={service} closeModal={() => setShowBooking(false)} />
      )}
    </>
  );
}
