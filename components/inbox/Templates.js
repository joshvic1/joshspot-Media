import { RowsSkeleton } from './Skeleton';
import { useEffect, useRef, useState } from 'react';
import { FiFileText, FiRefreshCw, FiSearch, FiImage, FiVideo, FiFile, FiMapPin } from 'react-icons/fi';
import { inboxApi } from './api';
import s from '../../styles/Inbox.module.css';

const title = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const accept = type => type === 'image' ? 'image/jpeg,image/png' : type === 'video' ? 'video/mp4' : 'application/pdf';
const icon = type => type === 'image' ? FiImage : type === 'video' ? FiVideo : FiFile;
const previewText = (component, values) => String(component.text || '').replace(/\{\{([^}]+)\}\}/g, (_, variable) => values[`${String(component.type).toLowerCase()}.${variable.trim()}`] || `{{${variable}}}`);

export default function Templates({ session, conversation, onSent }) {
  const [items, setItems] = useState([]); const [selected, setSelected] = useState(null); const [values, setValues] = useState({}); const [uploads, setUploads] = useState({});
  const [moreLoading, setMoreLoading] = useState(false); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [next, setNext] = useState(null);
  const pending = useRef(null); const preview = useRef(null);
  useEffect(() => { if (selected && window.matchMedia('(max-width: 900px)').matches) preview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [selected]);
  const [category, setCategory] = useState(''); const [status, setStatus] = useState(''); const [language, setLanguage] = useState('');
  const params = new URLSearchParams({ q: query, category, status, language }).toString();
  useEffect(() => {
    let active = true; const timer = setTimeout(() => {
      setLoading(true); inboxApi(`/templates?${params}`).then(result => { if (active) { setItems(result.items); setNext(result.next); setError(''); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    }, 300); return () => { active = false; clearTimeout(timer); };
  }, [params]);
  const sync = async () => { setBusy(true); setError(''); try { await inboxApi('/templates/sync', { method: 'POST', body: {} }); const result = await inboxApi(`/templates?${params}`); setItems(result.items); setNext(result.next); setSelected(null); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const select = item => { setSelected(item); setValues({}); setUploads({}); setError(''); pending.current = null; };
  const change = (key, value) => setValues(old => ({ ...old, [key]: value }));
  const upload = async (field, event) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file || !conversation) return;
    if (file.size > 5 * 1024 * 1024) { setError('Choose a header file smaller than 5 MB.'); return; }
    setBusy(true); setError('');
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('Could not read this file.')); reader.readAsDataURL(file); });
      const ticket = await inboxApi(`/conversations/${conversation._id}/media`, { method: 'POST', body: { data, name: file.name, templateMedia: true } });
      if (ticket.type !== field.mediaType) throw new Error(`Choose a ${field.mediaType} file for this template header.`);
      change(field.key, ticket.ticket); setUploads(old => ({ ...old, [field.key]: ticket }));
    } catch (err) { setError(err.message || 'Could not upload this header file.'); } finally { setBusy(false); }
  };
  const send = async event => {
    event.preventDefault(); if (!conversation) return; setBusy(true); setError('');
    const fingerprint = JSON.stringify({ templateId: selected._id, values }); if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, clientId: crypto.randomUUID() };
    try { await inboxApi(`/conversations/${conversation._id}/messages`, { method: 'POST', body: { type: 'template', templateId: selected._id, values, clientId: pending.current.clientId } }); pending.current = null; await onSent(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const fields = selected?.fields || [];
  return <div className={s.templates}><header><div><h2>{conversation ? 'Approved WhatsApp templates' : 'Templates'}</h2><p>Choose any approved template. Its required details will appear before sending.</p></div>{session.actor.admin && <button className={s.secondary} disabled={busy || !session.provider.configured} onClick={sync}><FiRefreshCw />{busy ? 'Please wait…' : 'Refresh from Meta'}</button>}</header>
    {!session.provider.configured && <div className={s.windowNotice}>Connect WhatsApp before syncing or sending templates.</div>}{error && <div className={s.error} role="alert">{error}</div>}
    <div className={s.search}><FiSearch /><input aria-label="Search templates" placeholder="Search templates…" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <div className={s.templateFilters}><select aria-label="Template category" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{['MARKETING', 'UTILITY', 'AUTHENTICATION'].map(value => <option key={value}>{value}</option>)}</select><select aria-label="Template status" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED', 'UNAVAILABLE'].map(value => <option key={value}>{value}</option>)}</select><input aria-label="Template language code" placeholder="Language, e.g. en_US" value={language} maxLength={40} onChange={event => setLanguage(event.target.value)} /></div>
    <div className={s.templateGrid}><div className={s.templateList}>{loading ? <RowsSkeleton count={4} /> : !items.length ? <div className={s.empty}><FiFileText /><h2>No templates found</h2><p>{session.actor.admin ? 'Create a template in WhatsApp Manager, then refresh it here.' : 'Ask an administrator to sync approved templates.'}</p></div> : items.map(item => <button key={item._id} className={selected?._id === item._id ? s.activeTemplate : ''} onClick={() => select(item)}><b>{item.name}</b><span>{item.language} · {item.category?.toLowerCase()} · {item.status?.toLowerCase()}</span><small className={s.mobileTemplateExcerpt}>{item.components?.find(component => component.type === 'BODY')?.text || item.components?.find(component => component.type === 'HEADER')?.format?.toLowerCase() + ' header'}</small></button>)}{moreLoading && <RowsSkeleton count={2} />}{next && <button className={s.loadMore} disabled={moreLoading} onClick={async () => { setMoreLoading(true); try { const result = await inboxApi(`/templates?${params}&before=${next}`); setItems(old => [...old, ...result.items]); setNext(result.next); } catch (err) { setError(err.message); } finally { setMoreLoading(false); } }}>Load more templates</button>}</div>
      {selected && <form ref={preview} className={s.templatePreview} onSubmit={send}><h3>{selected.name}</h3><div className={s.templateBody}>{selected.components.map((component, index) => <p key={index}>{component.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'].includes(component.format) ? `[${title(component.format)} header]` : component.type === 'BUTTONS' ? (component.buttons || []).map(button => `Button: ${button.text || title(button.type)}`).join('\n') : previewText(component, values)}</p>)}</div>
        {fields.filter(field => field.kind === 'text' || field.kind === 'button' || field.kind === 'flow').map(field => <label key={field.key}>{field.kind === 'button' ? `Button ${field.index + 1} ${title(field.subType)} value` : field.kind === 'flow' ? `Button ${field.index + 1} flow token` : `${title(field.component)} variable ${field.position}`}<input required maxLength={500} value={values[field.key] || ''} onChange={event => change(field.key, event.target.value)} placeholder={field.kind === 'flow' ? 'Flow token' : `Value for {{${field.position}}}`} /></label>)}
        {fields.filter(field => field.kind === 'media').map(field => { const Icon = icon(field.mediaType); const uploaded = uploads[field.key]; return <label key={field.key} className={s.templateMedia}><span><Icon />{uploaded ? uploaded.name : `Upload ${field.mediaType} header`}</span><input required type="file" accept={accept(field.mediaType)} disabled={busy || !conversation} onChange={event => upload(field, event)} />{uploaded && <small>Ready to send. Choose another file to replace it.</small>}</label>; })}
        {fields.some(field => field.kind === 'location') && <fieldset className={s.templateLocation}><legend><FiMapPin /> Header location</legend>{fields.filter(field => field.kind === 'location').map(field => <label key={field.key}>{title(field.locationPart)}<input required type={['latitude', 'longitude'].includes(field.locationPart) ? 'number' : 'text'} step="any" value={values[field.key] || ''} onChange={event => change(field.key, event.target.value)} /></label>)}</fieldset>}
        {!fields.length && <p>This template has no values to fill in. It is ready to send exactly as approved by Meta.</p>}
        {conversation && <button className={s.primary} disabled={busy || !session.provider.configured || selected.status !== 'APPROVED'}>{busy ? <span className={s.mediaSpinner} aria-label="Sending template" /> : 'Send template'}</button>}
      </form>}
    </div>
  </div>;
}
