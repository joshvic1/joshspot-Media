import { useState } from "react";
import { FaCopy } from "react-icons/fa";
import API from "../utils/api";
import styles from "../styles/Invoice.module.css";

const formatMoney = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

export default function InvoiceGenerator() {
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [note, setNote] = useState("");
  const [invoice, setInvoice] = useState(null);
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
      setInvoice(response.data.invoice);
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

  const copyText = async (label, value) => {
    await navigator.clipboard.writeText(value);
    alert(`${label} copied`);
  };

  const hasTransferDetails = invoice?.accountNumber && invoice?.bankName;
  const paymentMessage = hasTransferDetails
    ? `Pay ${formatMoney(invoice.amount)} via the link below
${invoiceUrl}

Or pay to the account below
${invoice.accountNumber}
${invoice.bankName}
${invoice.accountName || "Joshspot Media"}

Send receipt after payment`
    : "";

  const copyPaymentMessage = async () => {
    await navigator.clipboard.writeText(paymentMessage);
    alert("Payment message copied");
  };

  return (
    <main className={styles.invoicePage}>
      <section className={styles.generatorPanel}>
        <div className={styles.invoiceHero}>
          <span className={styles.badge}>Invoice generator</span>
          <h1>Create a clean payment message.</h1>
          <p>
            Enter the invoice details, generate the payment account, then copy
            one ready-to-send message for your client.
          </p>
        </div>

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
            {loading ? "Preparing Payment..." : "Pay Now"}
          </button>
        </form>

        {hasTransferDetails && (
          <div className={styles.messageBox}>
            <div className={styles.messageHeader}>
              <div>
                <span>Client payment message</span>
                <h2>Copy once and send</h2>
              </div>
              <button onClick={copyPaymentMessage}>
                <FaCopy /> Copy Message
              </button>
            </div>

            <pre>{paymentMessage}</pre>
          </div>
        )}

        {invoiceUrl && (
          <div className={styles.linkBox}>
            <span>Invoice link</span>
            <a
              className={styles.invoiceLink}
              href={invoiceUrl}
              rel="noreferrer"
              target="_blank"
            >
              {invoiceUrl}
            </a>
            <div className={styles.inlineActions}>
              <button onClick={copyLink}>Copy Link</button>
              <a
                className={styles.openLinkButton}
                href={invoiceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Link
              </a>
            </div>
          </div>
        )}

        {hasTransferDetails && (
          <div className={styles.transferBox}>
            <h2>Account details</h2>

            <CopyRow
              label="Amount"
              value={formatMoney(invoice.amount)}
              onCopy={copyText}
            />
            <CopyRow label="Bank Name" value={invoice.bankName} onCopy={copyText} />
            <CopyRow
              label="Account Number"
              value={invoice.accountNumber}
              onCopy={copyText}
            />
            <CopyRow
              label="Account Name"
              value={invoice.accountName || "Joshspot Media"}
              onCopy={copyText}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function CopyRow({ label, value, onCopy }) {
  return (
    <div className={styles.copyRow}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <button onClick={() => onCopy(label, value)} title={`Copy ${label}`}>
        <FaCopy />
      </button>
    </div>
  );
}
