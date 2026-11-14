import { FiSearch } from 'react-icons/fi';
import styles from '../../styles/Crm.module.css';

export default function ClientNameActions({
  name,
  conversationId,
  canOpenInbox,
  onOpenInbox,
  onFilter,
}) {
  const clientName = String(name || 'Unnamed client');
  const hasInboxLink = Boolean(canOpenInbox && conversationId);

  return <div className={styles.clientNameActions}>
    {hasInboxLink ? (
      <button
        type="button"
        className={styles.clientNameLink}
        onClick={() => onOpenInbox(conversationId)}
        title={`Open ${clientName}'s Inbox chat`}
      >
        {clientName}
      </button>
    ) : <h3>{clientName}</h3>}
    <button
      type="button"
      className={styles.clientNameFilter}
      onClick={() => onFilter(clientName)}
      aria-label={`Show ${clientName}'s records on this page`}
      title={`Show ${clientName}'s records`}
    >
      <FiSearch aria-hidden="true" />
    </button>
  </div>;
}
