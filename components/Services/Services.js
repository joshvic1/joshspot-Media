import styles from "./Services.module.css";
import { services } from "../../config/services";
import ServiceCard from "../ServiceCard/ServiceCard";

export default function Services() {
  return (
    <section className={styles.services} id="services">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>OUR SERVICES</span>
        </div>

        <div className={styles.grid}>
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              number={index + 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
