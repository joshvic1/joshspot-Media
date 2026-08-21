import { useState } from "react";
import API from "../utils/api";
import styles from "../styles/Invoice.module.css";

export default function InvoiceGenerator() {
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const createInvoice = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await API.post("/invoice", {
        amount: Number(amount),
        customerName,
        customerEmail,
        note,
      });

      setInvoiceUrl(response.data.invoiceUrl);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(invoiceUrl);
    alert("Invoice link copied");
  };

  return (
    <main className={styles.invoicePage}>
      <section className={styles.generatorPanel}>
        <span className={styles.badge}>Invoice generator</span>
        <h1>Create a payment invoice</h1>
        <p>
          Enter an amount, generate a private payment link, and send it to your
          client. The client will see temporary Paystack bank transfer details.
        </p>

        <form className={styles.generatorForm} onSubmit={createInvoice}>
          <label>
            <span>Amount</span>
            <input
              type="number"
              min="100"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Customer name (optional)</span>
            <input
              placeholder="e.g. RIGGS GYM"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </label>

          <label>
            <span>Customer email (optional)</span>
            <input
              type="email"
              placeholder="client@email.com"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
            />
          </label>

          <label>
            <span>Payment note (optional)</span>
            <textarea
              placeholder="e.g. Landing page audit payment"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate Invoice Link"}
          </button>
        </form>

        {invoiceUrl && (
          <div className={styles.linkBox}>
            <span>Invoice link</span>
            <strong>{invoiceUrl}</strong>
            <button onClick={copyLink}>Copy Link</button>
          </div>
        )}
      </section>
    </main>
  );
}
