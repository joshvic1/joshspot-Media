import { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiChevronRight, FiFileText, FiCheckCircle, FiUsers, FiLock, FiAlertCircle } from 'react-icons/fi';
import Modal from './Modal';
import { inboxApi } from './api';
import s from '../../styles/InboxActions.module.css';

const types = { setup: 'Setup', verification: 'Verification', ads: 'Ads' };
const services = { setup: ['Meta ads setup', 'TikTok ads setup - DM', 'Tiktok Ads Setup - Landing Page'], ads: ['TikTok Ads Landing Page', 'TikTok DM Ads', 'Meta Ads Landing Page', 'Meta DM Ads'] };
export default function ChatActions({ conversation, session, onClose, onSent, initialKind, recordId, onSaved }) {
  const [screen, setScreen] = useState(initialKind || 'menu'); const [customer, setCustomer] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState(null);
  const [existingId, setExistingId] = useState(null);
  const [form, setForm] = useState({}); const key = useRef(null); const locked = useRef(false);
  useEffect(() => { let active = true; inboxApi(`/conversations/${conversation._id}/actions/customer`).then(data => { if (active) setCustomer(data); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [conversation._id]);
  const go = async page => { if (busy) return; setScreen(page); setError(''); setResult(null); setForm({ servicePaidFor: services[page]?.[0] || '' }); key.current = null; locked.current = false; setExistingId(null);
    if (types[page] && (page !== 'ads' || recordId)) {
      setBusy(true);
      try { const data = await inboxApi(`/conversations/${conversation._id}/actions/crm/${page}${recordId ? `?recordId=${recordId}` : ''}`); if(data.record){setExistingId(data.record._id);setForm(data.record);} }
      catch(e){setError(e.message);locked.current=true;}finally{setBusy(false);}
    }
  };
  useEffect(() => { if(initialKind) go(initialKind); }, [initialKind, recordId]);
  const change = (field, value) => { if (locked.current) return; setForm(old => ({ ...old, [field]: value })); key.current = null; };
  const run = async (path, body) => {
    if (locked.current && busy) return; setBusy(true); setError('');
    try { const value = await inboxApi(`/conversations/${conversation._id}/actions/${path}`, { method: existingId && path.startsWith('crm/') ? 'PUT' : 'POST', body }); setResult(value); if(path.startsWith('crm/')) await onSaved?.(); if (value.queued) await onSent(); }
    catch (e) { setError(e.message); if (e.status && e.status < 500 && e.status !== 409) locked.current = false; }
    finally { setBusy(false); }
  };
  const submit = event => { event.preventDefault(); if (busy) return; key.current ||= crypto.randomUUID(); locked.current = true; run(screen === 'invoice' ? 'invoice' : `crm/${screen}${existingId ? `/${existingId}` : ''}`, { ...form, clientId: key.current }); };
  const payment = () => { go('payment'); run('payment', {}); };
  const upload = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Choose an ID document smaller than 5 MB.'); return; }
    try { const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); change('idCard', { fileName: file.name, mimeType: file.type, data }); setError(''); } catch { setError('Could not read the ID document.'); }
  };
  const title = screen === 'menu' ? 'Chat actions' : screen === 'crm' ? 'Add to CRM' : screen === 'invoice' ? 'Generate invoice' : screen === 'payment' ? 'Confirm payment' : `${existingId ? 'Edit' : 'Add'} ${types[screen]} client`;
  const field = (name, label, options = {}) => <label className={s.field} key={name}>{label}{options.choices ? <select value={form[name] || ''} onChange={e => change(name, e.target.value)} required>{options.choices.map(value => <option key={value}>{value}</option>)}</select> : options.multiline ? <textarea rows={3} value={form[name] || ''} onChange={e => change(name, e.target.value)} maxLength={10000} required={options.required} /> : <input type={options.number ? 'number' : 'text'} min={options.number ? 0 : undefined} step={options.number ? 'any' : undefined} value={form[name] || ''} onChange={e => change(name, e.target.value)} required={options.required} maxLength={10000} />}</label>;
  return <Modal title={title} onClose={() => { if (!busy) onClose(); }}><div className={s.body} key={screen}>
    {screen !== 'menu' && <button className={s.back} onClick={() => go(['setup', 'ads', 'verification'].includes(screen) ? 'crm' : 'menu')} disabled={busy}><FiArrowLeft /> Back</button>}
    {error && <div className={s.error} role="alert"><FiAlertCircle />{error}</div>}
    {screen === 'menu' ? <div className={s.options}>{[[FiFileText, 'Generate Invoice', 'Create and send a payment invoice', () => go('invoice')], [FiCheckCircle, 'Confirm Payment', 'Check the latest invoice privately', payment], [FiUsers, 'Add to CRM', 'Save this customer to your workspace', () => go('crm')]].map(([Icon, name, text, action]) => <button key={name} onClick={action}><span className={s.optionIcon}><Icon /></span><span><b>{name}</b><small>{text}</small></span><FiChevronRight /></button>)}</div>
    : screen === 'crm' ? <div className={s.options}>{Object.entries(types).map(([type, name]) => <button key={type} onClick={() => go(type)}><span className={s.optionIcon}><FiUsers /></span><span><b>{name}</b><small>Add a new {name.toLowerCase()} client</small></span><FiChevronRight /></button>)}</div>
    : screen === 'payment' ? <div className={`${s.result} ${result && !result.paid ? s.unpaid : ''}`} role="status">{busy ? <><span className={s.spinner} />Checking latest invoice…</> : result ? <>{result.paid ? <FiCheckCircle /> : <FiAlertCircle />}<h3>{result.paid ? 'Payment Received' : 'Payment not received yet'}</h3><p>₦{Number(result.amount).toLocaleString()} · {result.status}</p><small>This check does not send a customer message.</small><button className={s.primary} onClick={() => run('payment', {})}>Check again</button></> : <button className={s.primary} onClick={() => run('payment', {})}>Retry check</button>}</div>
    : result ? <div className={s.result} role="status"><FiCheckCircle /><h3>{result.queued ? 'Invoice queued for sending' : existingId ? 'Client details saved' : 'Client added to CRM'}</h3><p>{result.queued ? 'Delivery status will appear in the chat.' : 'The record is available in your CRM dashboard.'}</p><button className={s.primary} onClick={onClose}>Back to chat</button></div>
    : <form onSubmit={submit} className={s.form}>
      <div className={s.identity}><FiLock /><div>{customer ? <><b>{customer.name}</b><span>{customer.phone}</span></> : <span className={s.skeleton} />}</div><small>Chat customer</small></div>
      <fieldset disabled={busy || locked.current}>
      {screen === 'invoice' ? <label className={s.field}>Invoice amount (NGN)<input autoFocus type="number" inputMode="numeric" min="100" max="100000000" step="1" value={form.amount || ''} onChange={e => change('amount', e.target.value)} placeholder="Enter amount" required /></label> : <>
        {screen === 'verification' && field('businessName', 'Business name', { required: true })}
        {(screen === 'ads' || session.actor.role !== 'CSS') && field('amountPaid', 'Amount paid (NGN)', { number: true, required: screen === 'verification' })}
        {services[screen] && field('servicePaidFor', 'Service paid for', { choices: services[screen] })}
        {field('clientLoginDetails', 'Client login details', { multiline: true, required: screen === 'verification' })}
        {screen === 'setup' && <>{field('landingPageLogins', 'Landing page logins', { multiline: true })}{field('landingPageLink', 'Landing page link')}</>}
        {screen === 'ads' && <>{field('videoLinks', 'Video links', { multiline: true, required: true })}{field('note', 'Note', { multiline: true })}</>}
        {screen === 'verification' && <label className={s.field}>ID card<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={upload} required={!existingId && !form.idCard} /><small>{form.idCard?.fileName || 'JPEG, PNG or PDF · up to 5 MB'}</small></label>}
      </>}
      </fieldset>
      <button className={s.primary} type="submit" disabled={busy || locked.current || !customer}>{busy ? <span className={s.spinner} /> : screen === 'invoice' ? <FiFileText /> : <FiUsers />}{busy ? 'Processing…' : screen === 'invoice' ? 'Generate Invoice and Send' : existingId ? 'Save changes' : 'Add client'}</button>
    </form>}
  </div></Modal>;
}
