import { useState } from "react";
import Modal from "../Modal/Modal";
import styles from "./BookingModal.module.css";
import API from "../../utils/api";
import CountUp from "react-countup";

export default function BookingModal({ service, closeModal }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState("");
  const [adBudget, setAdBudget] = useState("");
  const [serviceFee, setServiceFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(service.price || 0);
  const durationFees = {
    "2 days": 10000,
    "1 week": 20000,
    "1 month": 80000,
    "3 months": 200000,
    "6 months": 350000,
  };
  const handleDurationChange = (value) => {
    setDuration(value);

    const fee = durationFees[value] || 0;

    setServiceFee(fee);

    const total = Number(adBudget || 0) + fee;

    setTotalPrice(total);
  };
  const handleBudgetChange = (value) => {
    const amount = Number(value);

    setAdBudget(amount);

    if (amount < 15000) {
      return;
    }

    const total = amount + serviceFee;

    setTotalPrice(total);
  };
  const handlePayment = async () => {
    if (loading) return; // prevents double click

    if (!name || !email || !phone) {
      alert("Please fill all fields");
      return;
    }

    /* extra validation for ads management */

    if (service.dynamicPricing) {
      if (!duration) {
        alert("Please select how long we should manage your ads");
        return;
      }

      if (!adBudget) {
        alert("Please enter your ads budget");
        return;
      }

      if (Number(adBudget) < 15000) {
        alert("Minimum ads budget is ₦15,000");
        return;
      }
    }

    try {
      setLoading(true);

      const response = await API.post("/payment/initialize", {
        name,
        email,
        phone,
        service: {
          ...service,
          calculatedPrice: totalPrice,
          duration,
          adBudget,
          serviceFee,
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
    name &&
    email &&
    phone &&
    (!service.dynamicPricing || (duration && adBudget >= 15000));
  return (
    <Modal closeModal={closeModal}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <h2 className={styles.title}>Book {service.title}</h2>

          <p className={styles.price}>
            ₦
            <CountUp end={totalPrice} duration={0.6} separator="," />
          </p>

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
          {service.dynamicPricing && (
            <div className={styles.dynamicFields}>
              <label>How long do you want us to manage your ads?</label>

              <select
                value={duration}
                disabled={loading}
                onChange={(e) => handleDurationChange(e.target.value)}
              >
                <option value="">Select duration</option>
                <option value="2 days">2 Days</option>
                <option value="1 week">1 Week</option>
                <option value="1 month">1 Month</option>
                <option value="3 months">3 Months</option>
                <option value="6 months">6 Months</option>
              </select>

              <label>How much ads budget do you want to run?</label>

              <input
                type="number"
                placeholder="Minimum ₦15,000"
                value={adBudget}
                disabled={loading}
                onChange={(e) => handleBudgetChange(e.target.value)}
              />

              {adBudget && adBudget < 15000 && (
                <p className={styles.error}>Minimum ad budget is ₦15,000</p>
              )}

              <label>Service Fee</label>

              <input
                type="text"
                value={`₦${serviceFee.toLocaleString()}`}
                readOnly
                className={styles.readOnlyInput}
              />
              <p className={styles.totalPrice}>
                Your total price is{" "}
                <p className={styles.price}>
                  ₦
                  <CountUp end={totalPrice} duration={0.6} separator="," />
                </p>
              </p>
            </div>
          )}
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
