import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import API from "../../utils/api";

export default function DeleteClient({ kind, client, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remove = async () => {
    if (busy || !window.confirm(`Delete ${client.businessName || "this client"}? This permanently removes this client record and cannot be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await API.delete(`/crm/${kind}/${client._id}`);
      onDeleted();
    } catch {
      setError("Unable to delete this client. Please try again.");
    } finally { setBusy(false); }
  };
  return <div><button type="button" onClick={remove} disabled={busy} aria-label={`Delete ${client.businessName || "client"}`} style={{ color: "#b42318", background: "#fff1f0", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", cursor: busy ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><FiTrash2 />{busy ? "Deleting…" : "Delete"}</button>{error && <p role="alert">{error}</p>}</div>;
}
