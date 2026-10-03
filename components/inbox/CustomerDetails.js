import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiExternalLink, FiX, FiUser, FiTag, FiClock, FiFolder, FiPaperclip, FiActivity, FiLock } from 'react-icons/fi';
import { inboxApi, fullDate, initials } from './api';
import Modal from './Modal';
import MediaAttachment from './MediaAttachment';
import s from '../../styles/Inbox.module.css';

function Resources({ id, kind }) {
  const [open, setOpen] = useState(false); const [items, setItems] = useState([]); const [more, setMore] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    inboxApi(`/conversations/${id}/messages?kind=${kind}`).then((result) => { if (active) { setItems(result.items.reverse()); setMore(result.more); setError(''); } }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id, kind, open]);
  return <details className={s.detailSection} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>{kind === 'media' ? <FiPaperclip /> : <FiActivity />}{kind === 'media' ? 'Media & files' : 'Notes & activity'}</summary>{open && <div className={s.sectionBody}>{error && <p className={s.error} role="alert">{error}</p>}{!items.length ? <p className={s.detailHint}>No {kind === 'media' ? 'attachments' : 'activity'} to show.</p> : items.map((message) => <div key={message._id} className={s.resourceItem}>{kind === 'media' ? <MediaAttachment conversationId={id} message={message} onError={setError} /> : <><b>{message.type === 'note' && <FiLock />}{message.authorName}</b><p>{message.text}</p></>}<time>{fullDate(message.createdAt)}</time></div>)}{more && <button className={s.loadMore} disabled={loading} onClick={async () => { setLoading(true); try { const result = await inboxApi(`/conversations/${id}/messages?kind=${kind}&before=${items.at(-1)._id}`); setItems((old) => [...old, ...result.items.reverse()]); setMore(result.more); } catch (err) { setError(err.message); } finally { setLoading(false); } }}>Load earlier</button>}</div>}</details>;
}
const localDateTime = (date) => { if (!date) return ''; const value = new Date(date); return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
export default function CustomerDetails({ conversation, session, canEdit, onClose, onUpdate, onChange, inline = false }) {
  const [fields, setFields] = useState(conversation.contact); const [labels, setLabels] = useState(conversation.labels.join(', '));
  const [when, setWhen] = useState(localDateTime(conversation.followUpAt));
  const [records, setRecords] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState('');
  useEffect(() => {
    let active = true;
    inboxApi(`/conversations/${conversation._id}/crm`).then((result) => { if (active) setRecords(result); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [conversation._id]);
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setSaved('');
    try { const result = await inboxApi(`/conversations/${conversation._id}/contact`, { method: 'PUT', body: { name: fields.name, email: fields.email, source: fields.source, service: fields.service, status: fields.status, revision: fields.revision } }); setFields(result); await onUpdate(); setSaved('Saved'); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const change = async (values) => {
    setError(''); setSaving(true);
    try { const ok = await onChange(values); if (!ok) setError('Could not save this change. Check the date or reopen the details to refresh the conversation.'); return ok; }
    finally { setSaving(false); }
  };
  const content = <>
    <div className={s.contactHero}><span className={s.avatar}>{initials(fields.name || fields.phone)}</span><strong>{fields.name || 'WhatsApp contact'}</strong><a href={`tel:+${fields.phone}`}>+{fields.phone}</a><span className={s.customerBadge}>{conversation.contact.status}</span></div>
    {error && <div className={s.error} role="alert">{error}</div>}
    <details className={s.detailSection}><summary><FiUser />Customer</summary><form className={s.form} onSubmit={save}>{['name', 'email', 'source', 'service'].map((key) => <label key={key}>{({ name: 'Name', email: 'Email', source: 'Lead source', service: 'Interested in' })[key]}<input type={key === 'email' ? 'email' : 'text'} maxLength={key === 'email' ? 254 : 120} disabled={!canEdit} value={fields[key] || ''} placeholder="Not provided" onChange={(event) => setFields({ ...fields, [key]: event.target.value })} /></label>)}<label>Customer status<select disabled={!canEdit} value={fields.status} onChange={(event) => setFields({ ...fields, status: event.target.value })}><option value="lead">Lead</option><option value="customer">Customer</option><option value="inactive">Inactive</option></select></label><div className={s.saveRow}>{canEdit && <button className={s.secondary} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>}<span role="status" className={s.saved}>{saved}</span></div></form></details>
    <details className={s.detailSection}><summary><FiClock />Conversation{conversation.followUpAt && conversation.status === 'follow_up' && <i className={s.sectionDot} />}</summary><div className={s.sectionBody}><div className={s.mobileAssignment}><label>Assigned representative<select aria-label="Mobile assigned representative" disabled={!session.actor.admin || saving} value={conversation.assignedTo || ''} onChange={(event) => change({ assignedTo: event.target.value || null })}><option value="">Unassigned</option>{session.staff.map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}</select></label>{!session.actor.admin && !conversation.assignedTo && <button className={s.secondary} disabled={saving} onClick={() => change({ assignedTo: session.actor.id })}>Assign to me</button>}</div><dl><dt>Assigned to</dt><dd>{session.staff.find((person) => person._id === conversation.assignedTo)?.name || 'Unassigned'}</dd><dt>Status</dt><dd>{conversation.status.replace('_', ' ')}</dd><dt>First contact</dt><dd>{fullDate(conversation.createdAt)}</dd><dt>Last message</dt><dd>{fullDate(conversation.lastInboundAt)}</dd></dl>{canEdit && <form className={s.form} onSubmit={async (event) => { event.preventDefault(); if (when) await change({ followUpAt: new Date(when).toISOString() }); }}><label>Follow up at<input aria-label="Follow-up date and time" type="datetime-local" required value={when} onChange={(event) => setWhen(event.target.value)} /></label><div className={s.saveRow}><button className={s.secondary}>Schedule</button>{conversation.followUpAt && <button className={s.textButton} type="button" onClick={async () => { if (await change({ followUpAt: null })) setWhen(''); }}>Clear</button>}</div></form>}{conversation.followUpAt && <p className={s.detailHint}>Scheduled: {fullDate(conversation.followUpAt)}</p>}</div></details>
    <details className={s.detailSection}><summary><FiTag />Labels<span className={s.sectionCount}>{conversation.labels.length || ''}</span></summary><div className={s.sectionBody}><div className={s.tags}>{conversation.labels.map((label) => <span key={label}>{label}</span>)}</div>{canEdit && <form className={s.form} onSubmit={async (event) => { event.preventDefault(); await change({ labels: labels.split(',').map((label) => label.trim()).filter(Boolean) }); }}><label>Separate labels with commas<input value={labels} onChange={(event) => setLabels(event.target.value)} placeholder="Hot lead, Payment pending" maxLength={600} /></label><button className={s.secondary}>Save labels</button></form>}</div></details>
    <details className={s.detailSection}><summary><FiFolder />CRM records<span className={s.sectionCount}>{records.length || ''}</span></summary><div className={s.sectionBody}><p className={s.recordId}>Contact ID · {fields._id}</p>{loading ? <p className={s.detailHint}>Loading…</p> : !records.length ? <p className={s.detailHint}>No linked CRM records.</p> : records.map((record) => <Link key={`${record.kind}-${record.id}`} href={record.href} className={s.record}><b>{record.name || record.kind}<FiExternalLink /></b><span>{record.service || record.kind}{record.amount != null ? ` · ₦${record.amount.toLocaleString()} · ${record.status}` : ''}</span><small>{record.id}</small></Link>)}</div></details>
    <Resources id={conversation._id} kind="media" /><Resources id={conversation._id} kind="activity" />
  </>;
  return inline ? <aside className={s.customerPanel} aria-label="Customer details"><header><span>Contact details</span><button className={s.iconButton} onClick={onClose} aria-label="Hide customer details"><FiX /></button></header><div className={s.customerScroll}>{content}</div></aside> : <Modal title="Contact details" drawer onClose={onClose}>{content}</Modal>;
}
