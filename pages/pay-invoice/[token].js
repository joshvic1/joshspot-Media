import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FaCopy } from "react-icons/fa";
import styles from "../../styles/Invoice.module.css";

const formatMoney = (amount) => `NGN ${Number(amount || 0).toLocaleString()}`;

export default function PayInvoice() {
  const router = useRouter();
  const { token } = router.query;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!router.isReady || typeof token !== "string") return;
    const controller = new AbortController();
    let timer;
    setInvoice(null); setLoading(true); setError(""); setNotFound(false);
    const load = async () => {
      let poll = true;
      try {
        const response = await fetch(`/api/pay-invoice/${encodeURIComponent(token)}`, {signal:controller.signal,cache:"no-store"});
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 404) { setNotFound(true); setInvoice(null); poll=false; return; }
        if (!response.ok) throw new Error(data.message || "Unable to load this invoice. Please retry.");
        setInvoice(data); setError(""); setNotFound(false);
        poll = data.status !== "paid" && data.status !== "expired";
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message || "Unable to load this invoice. Please retry.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          if (poll) timer = setTimeout(load,10000);
        }
      }
    };
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [router.isReady, token, retry]);

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
          <span className={styles.badge}>{notFound ? "Invoice not found" : "Invoice temporarily unavailable"}</span>
          <h1>{notFound ? "We could not find this invoice." : "We couldn’t load your invoice yet."}</h1>
          <p role="alert">{notFound ? "Please check the full payment link or ask the sender for a new one." : error}</p>
          <button type="button" onClick={() => setRetry(value => value+1)}>Try again</button>
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
        {error && <p role="alert">Payment status could not be refreshed. We’ll retry automatically. Please don’t pay again if you already made the transfer.</p>}
        {isPaid ? (
          <div className={styles.paidNotice}>
            <span>✓</span>
            <h1>Payment has been made for this invoice.</h1>
            <p>You do not need to make another payment.</p>
          </div>
        ) : (
          <>
            <div className={styles.invoiceHero}>
              <span className={styles.badge}>Joshspot Media Invoice</span>
              <h1>{formatMoney(invoice.amount)}</h1>
              <p>
                {invoice.customerName
                  ? `${invoice.customerName}, pay the exact amount using the account details below.`
                  : "Pay the exact amount using the account details below."}
              </p>
            </div>
            {!hasTransferDetails && !isExpired && (
              <p className={styles.waitingText}>Preparing payment account...</p>
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

        {hasTransferDetails && !isPaid && !isExpired && (
          <div className={styles.transferBox}>
            <h2>Pay to this account</h2>

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
