import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiRotateCcw, FiShield } from "react-icons/fi";
import styles from "../../styles/RefundInvoice.module.css";

const money = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;
const date = (value) => value ? new Date(value).toLocaleString("en-NG", { dateStyle:"medium", timeStyle:"short", timeZone:"Africa/Lagos" }) : "—";
const newKey = () => globalThis.crypto?.randomUUID?.().replaceAll("-", "_") || `refund_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;

export default function RefundInvoice({ record, demo, onChange }) {
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  const refundLimit = Number(preview?.maximumAmount ?? 0);
  const selectedRows = useMemo(() => Object.entries(selected).filter(([, value]) => value).map(([key]) => {
    const [kind, id] = key.split(":"); return { kind, id };
  }), [selected]);
  const close = () => { if (!busy) { dialog.current?.close(); setOpen(false); } };

  async function load() {
    setBusy(true); setError(""); setNotice("");
    try {
      if (demo) {
        setPreview({ invoice:{ amount:record.amount, refundedAmount:0, refundReservedAmount:0, paymentProvider:"paystack" }, provider:"paystack", supported:true, maximumAmount:record.amount, records:[], refunds:[] });
        setAmount(String(record.amount || "")); return;
      }
      const response = await fetch(`/api/admin/paid-invoices/${record.id}/refund-preview`, { headers:{ authorization:localStorage.getItem("adminToken") || "" } });
      const result = await response.json(); if (!response.ok) throw Error(result.message || "Unable to load refund details.");
      setPreview(result); setAmount(String(result.maximumAmount || ""));
    } catch (loadError) { setError(loadError.message || "Unable to load refund details."); }
    finally { setBusy(false); }
  }
  const openDialog = () => { setOpen(true); setPreview(null); setError(""); setNotice(""); setSelected({}); setReason(""); load(); };
  const toggle = (row) => setSelected((current) => ({ ...current, [`${row.kind}:${row.id}`]: !current[`${row.kind}:${row.id}`] }));

  async function submit(event) {
    event.preventDefault(); if (busy || !preview?.supported) return;
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount < 1 || numericAmount > refundLimit) { setError(`Enter a whole number from ₦1 to ${money(refundLimit)}.`); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      if (demo) { setNotice("Preview only: no refund request was created."); return; }
      const response = await fetch(`/api/admin/paid-invoices/${record.id}/refunds`, {
        method:"POST", headers:{ authorization:localStorage.getItem("adminToken") || "", "Content-Type":"application/json" },
        body:JSON.stringify({ amount:numericAmount, reason, records:selectedRows, idempotencyKey:newKey() }),
      });
      const result = await response.json(); if (!response.ok) throw Error(result.message || "Unable to request the refund.");
      setNotice(result.message || "Refund request submitted."); onChange?.(result.message || "Refund request submitted."); await load();
    } catch (submitError) { setError(submitError.message || "Unable to request the refund."); }
    finally { setBusy(false); }
  }
  async function refresh(refundId) {
    setBusy(true); setError("");
    try {
      if (demo) { setNotice("Preview only: no provider status was checked."); return; }
      const response = await fetch(`/api/admin/refunds/${refundId}/refresh`, { method:"POST", headers:{ authorization:localStorage.getItem("adminToken") || "", "Content-Type":"application/json" }, body:"{}" });
      const result = await response.json(); if (!response.ok) throw Error(result.message || "Unable to refresh the refund.");
      setNotice(result.message); onChange?.(result.message); await load();
    } catch (refreshError) { setError(refreshError.message || "Unable to refresh the refund."); }
    finally { setBusy(false); }
  }

  const fullyRefunded = Number(record.refundedAmount || 0) >= Number(record.amount || 0) && Number(record.amount || 0) > 0;
  const refundBlocked = fullyRefunded || ["pending", "processing", "needs_attention"].includes(record.refundStatus);
  return <>
    <button type="button" className={styles.trigger} title={refundBlocked ? "View the refund state from this invoice" : "Refund this paid invoice"} onClick={openDialog}><FiRotateCcw /> {fullyRefunded ? "Refunded" : refundBlocked ? "Refund pending" : "Refund"}</button>
    {open && typeof document !== "undefined" && createPortal(<dialog ref={dialog} className={styles.dialog} onCancel={(event) => { if (busy) event.preventDefault(); else setOpen(false); }} onClose={() => setOpen(false)} aria-labelledby={`refund-${record.id}`}>
      <form onSubmit={submit}>
        <div className={styles.head}><span className={styles.icon}><FiRotateCcw /></span><div><span className={styles.eyebrow}>ADMIN-ONLY PAYMENT CONTROL</span><h2 id={`refund-${record.id}`}>Refund paid invoice</h2></div></div>
        {busy && !preview ? <p className={styles.loading}>Loading refund details…</p> : preview && <>
          <div className={styles.invoice}><div><span>Customer</span><strong>{record.name || "Unnamed customer"}</strong></div><div><span>Invoice paid</span><strong>{money(preview.invoice.amount)}</strong></div><div><span>Available to refund</span><strong>{money(refundLimit)}</strong></div><div><span>Gateway</span><strong>{preview.invoice.paymentProvider === "flutterwave" ? "Flutterwave" : preview.invoice.paymentProvider === "moniepoint" ? "Moniepoint" : "Paystack"}</strong></div></div>
          {!preview.supported ? <p className={styles.blocked}><FiAlertTriangle /> {preview.reason}</p> : <>
            <p className={styles.warning}><FiShield /> This sends a real refund request to {preview.provider === "flutterwave" ? "Flutterwave" : "Paystack"}. It cannot be undone here. Any selected CRM records stay active until the gateway confirms the refund.</p>
            <div className={styles.fields}><label>Refund amount (₦)<input type="number" inputMode="numeric" min="1" max={refundLimit} step="1" value={amount} disabled={busy || !refundLimit} onChange={(event) => setAmount(event.target.value)} required /></label><button type="button" className={styles.full} disabled={busy || !refundLimit} onClick={() => setAmount(String(refundLimit))}>Refund full amount</button></div>
            <label className={styles.reason}>Reason for refund<textarea required minLength={3} maxLength={500} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} placeholder="For example: duplicate payment or service cancellation" /></label>
            <section className={styles.records}><div><h3>Related CRM records</h3><p>Select only records you want retracted after this refund is confirmed. They are hidden from active CRM views, not permanently deleted.</p></div>
              {preview.records?.length ? <div className={styles.recordGrid}>{preview.records.map((row) => <label key={`${row.kind}-${row.id}`} className={styles.record}><input type="checkbox" checked={Boolean(selected[`${row.kind}:${row.id}`])} disabled={busy} onChange={() => toggle(row)} /><span><b>{row.title}</b><small>{row.category} · {row.service}</small><small>{money(row.amountPaid)} · Added {date(row.createdAt)}</small></span></label>)}</div> : <p className={styles.none}>No active setup, ads, or verification record has the same customer number.</p>}
            </section>
          </>}
          {preview.refunds?.length > 0 && <section className={styles.history}><h3>Refund history</h3>{preview.refunds.map((refund) => <div key={refund.id} className={styles.historyRow}><span><b>{money(refund.amount)}</b><small>{refund.provider} · {date(refund.createdAt)}</small><small>{refund.errorMessage || refund.reason}</small></span><em data-status={refund.status}>{refund.status.replaceAll("_", " ")}</em>{["pending","processing","needs_attention","initiating"].includes(refund.status) && <button type="button" disabled={busy} onClick={() => refresh(refund.id)}><FiRefreshCw /> Refresh status</button>}</div>)}</section>}
        </>}
        {notice && <p className={styles.notice} role="status"><FiCheckCircle /> {notice}</p>}{error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><button type="button" disabled={busy} onClick={close}>Close</button>{preview?.supported && refundLimit > 0 && <button type="submit" disabled={busy}>{busy ? "Working…" : `Request ${money(amount || 0)} refund`}</button>}</div>
      </form>
    </dialog>, document.body)}
  </>;
}
