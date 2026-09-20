import { useMemo, useState } from "react";
import { FiArrowUpRight, FiLock } from "react-icons/fi";
import API from "../../utils/api";
import Modal from "../Modal/Modal";
import styles from "./BookingModal.module.css";

export default function BookingModal({ service, closeModal }) {
  const firstOption = service.options?.[0] || null;
  const [selectedOption, setSelectedOption] = useState(service.requireOptionSelection ? "" : firstOption?.label || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const selectedPackage = useMemo(() => {
    if (!service.options?.length) {
      return null;
    }

    return service.options.find((option) => option.label === selectedOption);
  }, [selectedOption, service.options]);

  const totalPrice = selectedPackage?.price || service.price || 0;

  const handlePayment = async (event) => {
    event.preventDefault();
    setPaymentError("");
    if (loading) return;

    if (!name || !email || !phone) {
      setPaymentError("Please fill in all your details.");
      return;
    }

    if (service.options?.length && !selectedPackage) {
      setPaymentError("Please select a package.");
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
      setPaymentError("We could not open payment. Please try again.");
      setLoading(false);
    }
  };

  const isFormValid =
    name && email && phone && (!service.options?.length || selectedPackage);

  const Icon = service.icon;
  return (
    <Modal closeModal={closeModal} compact service={service}>
      <form className={styles.bookingForm} onSubmit={handlePayment}>
        <header className={styles.bookingHeading}>
          <span className={styles.bookingIcon}>{Icon && <Icon />}</span>
          <div><span className={styles.bookingEyebrow}>BOOK YOUR SERVICE</span><h2>{service.title}</h2></div>
        </header>
        <p className={styles.bookingLead}>A few details, then you’re ready to pay.</p>
        {service.options?.length > 0 && (
          <label className={styles.bookingField}>
            {service.bookingQuestion}
            <select value={selectedOption} onChange={event => setSelectedOption(event.target.value)} disabled={loading} required>
              {service.requireOptionSelection && <option value="" disabled>Select a platform</option>}
              {service.options.map(option => <option key={option.label} value={option.label}>{option.label} — ₦{option.price.toLocaleString("en-NG")}</option>)}
            </select>
          </label>
        )}
        <div className={styles.bookingFields}>
          <label className={styles.bookingField}>Full name<input type="text" name="name" autoComplete="name" placeholder="Your full name" required value={name} disabled={loading} onChange={event => setName(event.target.value)} /></label>
          <label className={styles.bookingField}>Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required value={email} disabled={loading} onChange={event => setEmail(event.target.value)} /></label>
          <label className={styles.bookingField}>WhatsApp number<input type="tel" name="phone" autoComplete="tel" placeholder="e.g. 0801 234 5678" required value={phone} disabled={loading} onChange={event => setPhone(event.target.value)} /></label>
        </div>
        <div className={styles.bookingTotal}><span>Total to pay<small>{selectedOption || service.eyebrow}</small></span><strong>₦{totalPrice.toLocaleString("en-NG")}</strong></div>
        {paymentError && <p className={styles.bookingError} role="alert">{paymentError}</p>}
        <button className={styles.bookingPay} type="submit" disabled={loading || !isFormValid}>{loading ? "Opening Paystack…" : "Continue to payment"}<FiArrowUpRight /></button>
        <p className={styles.bookingSecure}><FiLock /> Secure checkout with Paystack</p>
      </form>
    </Modal>
  );
}
