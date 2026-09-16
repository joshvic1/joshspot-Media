import { FiChevronDown } from "react-icons/fi";
import styles from "../../styles/Crm.module.css";

const labels = { pending: "Funds: pending", sent: "Funds: sent", not_needed: "Funds: not needed" };
export default function FundsBadge({ client, editable, saving, onChange }) {
  const value = client.fundsStatus || (client.fundsSent ? "sent" : "pending");
  const status = labels[value] ? value : "pending";
  return <span className={`${styles.fundsBadge} ${styles[`funds_${status}`]}`} aria-busy={saving || undefined}>
    <span className={styles.fundsDot} aria-hidden="true" />
    <span>{saving ? "Saving…" : labels[status]}</span>
    {editable && <>
      <FiChevronDown className={styles.fundsChevron} aria-hidden="true" />
      <select className={styles.fundsSelect} aria-label={`Funds status for ${client.businessName}`} value={status} disabled={saving} onChange={(event) => onChange(event.target.value)}>
        {Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </>}
  </span>;
}
