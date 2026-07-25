import { services } from "../../config/services";
import ServiceCard from "../ServiceCard/ServiceCard";
import styles from "./Services.module.css";

export default function Services() {
  return (
    <section className={styles.services} id="services">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Services and free trainings</span>
          <h2>Choose the exact support your business needs now.</h2>
          <p>
            Select any of the services below ,click on View Details to learn
            more about each service, and click Book Now to pay for the service.
            We will help you get the most out of your ad campaigns and grow your
            business.
          </p>
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
