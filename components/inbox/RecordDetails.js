import { useEffect, useState } from 'react';
import Modal from './Modal';
import { RowsSkeleton } from './Skeleton';
import { inboxApi, fullDate } from './api';
import s from '../../styles/Inbox.module.css';
const titles = { Client: 'Setup details', AdsClient: 'Ads details', VerificationClient: 'Verification details', Invoice: 'Invoice details' };
const labels = { name: 'Customer', customerName: 'Customer', businessName: 'Business name', clientNumber: 'Phone', customerPhone: 'Phone', customerEmail: 'Email', servicePaidFor: 'Service', service: 'Service', product: 'Product', amountPaid: 'Amount paid', amount: 'Invoice amount', status: 'Status', adsPublished: 'Ads published', fundsStatus: 'Funds status', landingPageLink: 'Landing page', videoLinks: 'Video links', note: 'Notes', createdAt: 'Created', paidAt: 'Paid', expiresAt: 'Expires' };
function display(key, value) {
  if (['amount', 'amountPaid'].includes(key)) return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
  if (key.endsWith('At')) return fullDate(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'landingPageLink' && /^https?:\/\//i.test(value)) return <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>;
  return String(value).replace(key === 'fundsStatus' ? /_/g : /$^/, ' ');
}
export default function RecordDetails({ conversationId, record, onClose }) {
  const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setData(null); setError('');
    inboxApi(`/conversations/${conversationId}/crm/${record.kind}/${record.id}`).then(result => { if (active) setData(result.record); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [conversationId, record.kind, record.id]);
  return <Modal title={titles[record.kind] || 'Record details'} onClose={onClose}>
    {error ? <p className={s.error} role="alert">{error}</p> : !data ? <RowsSkeleton count={3} /> : <dl className={s.crmRecordDetails}>{Object.entries(labels).filter(([key]) => data[key] !== undefined && data[key] !== null && data[key] !== '').map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{display(key, data[key])}</dd></div>)}</dl>}
  </Modal>;
}
