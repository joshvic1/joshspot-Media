import { FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import s from '../../styles/Inbox.module.css';
export default function MessageStatus({ status }) {
  const double = status === 'delivered' || status === 'read';
  return <span className={`${s.messageStatus} ${status === 'read' ? s.readReceipt : ''}`} role="img" aria-label={status} title={status}>
    {['failed', 'unknown'].includes(status) ? <FiAlertCircle /> : ['sent', 'delivered', 'read'].includes(status) ? <><FiCheck />{double && <FiCheck className={s.secondTick} />}</> : <FiClock />}
  </span>;
}
