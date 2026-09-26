import { useEffect, useRef, useState } from "react";
import styles from "../../styles/ReceiptDialog.module.css";

export default function SendReceipt({record,demo,onSent}) {
  const dialog=useRef(null);
  const [open,setOpen]=useState(false),[email,setEmail]=useState(record.email || ""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
  const close=()=>{if(busy)return;dialog.current?.close();setOpen(false);};
  const send=async event=>{
    event.preventDefault();if(busy)return;
    setBusy(true);setError("");
    try {
      if(demo){onSent("Preview only: no receipt was emailed.");dialog.current?.close();setOpen(false);return;}
      const response=await fetch(`/api/admin/paid-invoices/${record.id}/receipt`,{method:"POST",headers:{authorization:localStorage.getItem("adminToken") || "","Content-Type":"application/json"},body:JSON.stringify({email})});
      const result=await response.json();
      if(!response.ok)throw Error(result.message || "Unable to send receipt.");
      dialog.current?.close();setOpen(false);onSent(result.message);
    }catch(error){setError(error.message);}finally{setBusy(false);}
  };
  return <>
    <button type="button" className={styles.send} onClick={()=>{setEmail(record.email || "");setError("");setOpen(true);}}>Send receipt</button>
    <dialog ref={dialog} className={styles.dialog} onCancel={event=>{if(busy)event.preventDefault();else setOpen(false);}} onClose={()=>setOpen(false)} aria-labelledby={`receipt-${record.id}`}>
      <form onSubmit={send}>
        <span className={styles.eyebrow}>JOSHSPOT MEDIA · PAYMENT RECEIPT</span>
        <h2 id={`receipt-${record.id}`}>Send payment receipt</h2>
        <p>{record.name || "Customer"} · {record.service}</p>
        <strong className={styles.amount}>{new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format(record.amount)}</strong>
        <p>The email includes a receipt number, customer details, payment reference, payment date and amount received.</p>
        <label>Customer email<input type="email" required maxLength={254} value={email} readOnly={!!record.email} disabled={busy} onChange={event=>setEmail(event.target.value)} placeholder="customer@example.com" /></label>
        {!record.email && <p className={styles.hint}>This email will be saved to the invoice.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><button type="button" disabled={busy} onClick={close}>Cancel</button><button type="submit" disabled={busy}>{busy?"Sending…":demo?"Preview send":"Send receipt"}</button></div>
      </form>
    </dialog>
  </>;
}
