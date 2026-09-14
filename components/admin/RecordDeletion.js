import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FiTrash2 } from "react-icons/fi";
import styles from "../../styles/AdminReports.module.css";
const Deletion = createContext(null);
export function DeleteButton({ kind, id, label, onChange }) {
  const select = useContext(Deletion);
  return <button type="button" className={styles.deleteButton} title={`Delete ${label}`} aria-label={`Delete ${label}`} onClick={() => select({ kind, id, label, onChange })}><FiTrash2 /></button>;
}
export default function RecordDeletion({ children }) {
  const router = useRouter();
  const demo = process.env.NODE_ENV === "development" && router.query.preview === "demo";
  const [target, setTarget] = useState(null), [last, setLast] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => { if (target) dialog.current?.showModal(); }, [target]);
  const close = () => { dialog.current?.close(); setTarget(null); };
  const change = async (record, restore = false) => {
    setBusy(true); setError("");
    try {
      if (!demo) {
        const response = await fetch(`/api/admin/records/${record.kind}/${record.id}${restore ? "/restore" : ""}`, {
          method: restore ? "POST" : "DELETE", headers: { authorization: localStorage.getItem("adminToken") || "" },
        });
        const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to update this record.");
        record.onChange?.();
      }
      setLast(restore ? null : record); close();
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  };
  return <Deletion.Provider value={(record) => { setError(""); setTarget(record); }}>{children}
    {last && <div className={styles.undo} role="status"><span>{demo ? "Preview only. No records were deleted." : `${last.label} deleted.`}</span>
      {!demo && <button disabled={busy} onClick={() => change(last, true)}>Undo</button>}
      <button aria-label="Dismiss deletion notice" onClick={() => setLast(null)}>×</button>{error && <span role="alert">{error}</span>}
    </div>}
    <dialog className={styles.deleteDialog} ref={dialog} onCancel={(event) => { if (busy) event.preventDefault(); else setTarget(null); }} onClose={() => setTarget(null)}>
      {target && <><FiTrash2 /><h2>Delete this record?</h2><p><strong>{target.label}</strong> will be removed from CRM lists and totals. This does not refund or cancel a Paystack payment. You can undo the deletion using the notice afterwards.</p>
        {error && <p role="alert">{error}</p>}<div><button disabled={busy} onClick={close}>Keep record</button><button disabled={busy} onClick={() => change(target)}>{busy ? "Deleting…" : demo ? "Preview delete" : "Delete record"}</button></div></>}
    </dialog>
  </Deletion.Provider>;
}
