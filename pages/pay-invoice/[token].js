import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FaCopy } from "react-icons/fa";
import API from "../../utils/api";
import styles from "../../styles/Invoice.module.css";

const formatMoney = (amount) => `NGN ${Number(amount || 0).toLocaleString()}`;

export default function PayInvoice() {
  const router = useRouter();
  const { token } = router.query;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingPayment, setStartingPayment] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetchInvoice();
  }, [token]);

  useEffect(() => {
    if (!token || !invoice || invoice.status !== "pending") return;

    const interval = setInterval(fetchInvoice, 10000);
    return () => clearInterval(interval);
  }, [invoice, token]);

  const fetchInvoice = async () => {
    try {
      const response = await API.get(`/invoice/${token}`);
      setInvoice(response.data);
    } catch {
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const startTransfer = async () => {
    setStartingPayment(true);

    try {
      const response = await API.post(`/invoice/${token}/transfer`);
      setInvoice(response.data);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to generate account");
    } finally {
      setStartingPayment(false);
    }
  };

  const copyText = async (label, value) => {
    await navigator.clipboard.writeText(value);
    alert(`${label} copied`);
  };

  if (loading) {
    return (
      <main className={styles.invoicePage}>
        <section className={styles.paymentPanel}>
          <p>Loading invoice...</p>
        </section>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className={styles.invoicePage}>
        <section className={styles.paymentPanel}>
          <span className={styles.badge}>Invoice not found</span>
          <h1>This invoice link is invalid.</h1>
        </section>
      </main>
    );
  }

  const hasTransferDetails = invoice.accountNumber && invoice.bankName;
  const isPaid = invoice.status === "paid";
  const isExpired = invoice.status === "expired";

  return (
    <main className={styles.invoicePage}>
      <section className={styles.paymentPanel}>
        {isPaid ? (
          <div className={styles.paidNotice}>
            <span>✓</span>
            <h1>Payment has been made for this invoice.</h1>
            <p>You do not need to make another payment.</p>
          </div>
        ) : (
          <>
            <span className={styles.badge}>Joshspot Media Invoice</span>
            <h1>{formatMoney(invoice.amount)}</h1>
            <p>
              {invoice.customerName
                ? `${invoice.customerName}, pay the exact amount to the account below.`
                : "Pay the exact amount to the account below."}
            </p>

            {!hasTransferDetails && !isExpired && (
              <button
                className={styles.payButton}
                disabled={startingPayment}
                onClick={startTransfer}
              >
                {startingPayment ? "Generating Account..." : "Pay Now"}
              </button>
            )}
          </>
        )}

        {invoice.note && (
          <div className={styles.noteBox}>
            <span>Payment note</span>
            <strong>{invoice.note}</strong>
          </div>
        )}

        {isExpired && !isPaid && (
          <div className={styles.expiredNotice}>
            <h2>This invoice has expired.</h2>
            <p>Please request a new payment link.</p>
          </div>
        )}

        {hasTransferDetails && (
          <div className={styles.transferBox}>
            <h2>Transfer Details</h2>

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

            {!isPaid && (
              <p className={styles.waitingText}>
                After transfer, keep this page open. We will update it once
                Paystack confirms the payment.
              </p>
            )}
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
