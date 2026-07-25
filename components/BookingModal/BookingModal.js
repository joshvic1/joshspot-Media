import { useMemo, useState } from "react";
import CountUp from "react-countup";
import API from "../../utils/api";
import Modal from "../Modal/Modal";
import styles from "./BookingModal.module.css";

export default function BookingModal({ service, closeModal }) {
  const firstOption = service.options?.[0] || null;
  const [selectedOption, setSelectedOption] = useState(firstOption?.label || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPackage = useMemo(() => {
    if (!service.options?.length) {
      return null;
    }

    return service.options.find((option) => option.label === selectedOption);
  }, [selectedOption, service.options]);

  const totalPrice = selectedPackage?.price || service.price || 0;

  const handlePayment = async () => {
    if (loading) return;

    if (!name || !email || !phone) {
      alert("Please fill all fields");
      return;
    }

    if (service.options?.length && !selectedPackage) {
      alert("Please select a package");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/payment/initialize", {
        name,
        email,
        phone,
        service: {
          ...service,
          title: selectedPackage
            ? `${service.title} - ${selectedPackage.label}`
            : service.title,
          calculatedPrice: totalPrice,
          duration: selectedPackage?.label || "",
          packageSelected: selectedPackage?.label || "",
          serviceFee: totalPrice,
        },
      });

      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.log(error);
      alert("Payment failed");
      setLoading(false);
    }
  };

  const isFormValid =
    name && email && phone && (!service.options?.length || selectedPackage);

  return (
    <Modal closeModal={closeModal}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span>{service.eyebrow || "Booking"}</span>
            <h2>Book {service.title}</h2>
            <p>{service.description}</p>
          </div>

          {service.options?.length > 0 && (
            <div className={styles.packages}>
              <label>{service.bookingQuestion}</label>
              <div className={styles.optionGrid}>
                {service.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={`${styles.option} ${
                      selectedOption === option.label ? styles.selected : ""
                    }`}
                    disabled={loading}
                    onClick={() => setSelectedOption(option.label)}
                  >
                    <span>{option.label}</span>
                    <strong>₦{option.price.toLocaleString()}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.pricePanel}>
            <span>Total</span>
            <strong>
              ₦<CountUp end={totalPrice} duration={0.45} separator="," />
            </strong>
          </div>

          <div className={styles.form}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="tel"
              placeholder="WhatsApp Number"
              value={phone}
              disabled={loading}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            className={`${styles.pay} ${loading ? styles.loading : ""}`}
            onClick={handlePayment}
            disabled={loading || !isFormValid}
          >
            {loading ? "Redirecting to Paystack..." : "Proceed to Payment →"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
