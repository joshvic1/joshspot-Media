import { useEffect, useState } from 'react';
import { FiFileText, FiUser, FiCreditCard, FiClock } from 'react-icons/fi';
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
  const invoice = record.kind === 'Invoice';
  const groups = [
    { title: 'Customer & service', icon: FiUser, keys: ['name','customerName','businessName','clientNumber','customerPhone','customerEmail','servicePaidFor','service','product'] },
    { title: invoice ? 'Payment references' : 'Record information', icon: FiCreditCard, keys: invoice ? ['_id','reference','paymentProvider','flutterwaveTransactionId','flutterwaveOrderRef'] : ['_id','adsPublished','fundsStatus','landingPageLink','videoLinks'] },
    { title: 'Timeline', icon: FiClock, keys: ['createdAt','paidAt','expiresAt'] },
    { title: 'Notes', icon: FiFileText, keys: ['note'] }
  ];
  const fieldLabels = { ...labels, _id: invoice ? 'Invoice ID' : 'Record ID', reference: 'Payment reference', paymentProvider: 'Payment provider', flutterwaveTransactionId: 'Transaction ID', flutterwaveOrderRef: 'Order reference' };
  const has = key => data && data[key] !== undefined && data[key] !== null && data[key] !== '';
  return <Modal title={titles[record.kind] || 'Record details'} onClose={onClose}>
    {error ? <p className={s.error} role="alert">{error}</p> : !data ? <RowsSkeleton count={3} /> : <div className={s.recordDetailLayout}>
      <div className={s.recordDetailHero}><span className={s.recordDetailIcon}><FiFileText /></span><div><small>{invoice ? 'Invoice amount' : 'Amount paid'}</small><strong>{has(invoice ? 'amount' : 'amountPaid') ? display(invoice ? 'amount' : 'amountPaid', invoice ? data.amount : data.amountPaid) : titles[record.kind]}</strong></div>{data.status && <span className={s.recordStatus} data-status={data.status}>{data.status}</span>}</div>
      {groups.map(({title, icon: Icon, keys}) => { const visible = keys.filter(has); return visible.length > 0 && <section key={title} className={s.recordDetailSection}><h3><Icon />{title}</h3><dl className={s.crmRecordDetails}>{visible.map(key => <div key={key}><dt>{fieldLabels[key]}</dt><dd>{display(key, data[key])}</dd></div>)}</dl>{invoice && title === 'Payment references' && !has('reference') && <p className={s.detailHint}>No payment reference recorded yet.</p>}</section>; })}
    </div>}
  </Modal>;
}
