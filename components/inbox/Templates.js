import { RowsSkeleton } from './Skeleton';
import { useEffect, useRef, useState } from 'react';
import { FiFileText, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { inboxApi } from './api';
import s from '../../styles/Inbox.module.css';
export default function Templates({ session, conversation, onSent }) {
  const [items, setItems] = useState([]); const [selected, setSelected] = useState(null); const [values, setValues] = useState({});
  const [moreLoading, setMoreLoading] = useState(false);
  const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [next, setNext] = useState(null);
  const pending = useRef(null); const preview = useRef(null);
  useEffect(() => { if (selected && window.matchMedia('(max-width: 900px)').matches) preview.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [selected]);
  const [category, setCategory] = useState(''); const [status, setStatus] = useState(''); const [language, setLanguage] = useState('');
  const params = new URLSearchParams({ q: query, category, status, language }).toString();
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      inboxApi(`/templates?${params}`).then((result) => { if (active) { setItems(result.items); setNext(result.next); setError(''); } }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [params]);
  const sync = async () => {
    setBusy(true); setError('');
    try { await inboxApi('/templates/sync', { method: 'POST', body: {} }); const result = await inboxApi(`/templates?${params}`); setItems(result.items); setNext(result.next); setSelected(null); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const send = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const fingerprint = JSON.stringify({ templateId: selected._id, values });
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, clientId: crypto.randomUUID() };
    try { await inboxApi(`/conversations/${conversation._id}/messages`, { method: 'POST', body: { type: 'template', templateId: selected._id, values, clientId: pending.current.clientId } }); pending.current = null; await onSent(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className={s.templates}><header><div><h2>{conversation ? 'Approved WhatsApp templates' : 'Templates'}</h2><p>Managed and approved in Meta WhatsApp Manager.</p></div>{session.actor.admin && <button className={s.secondary} disabled={busy || !session.provider.configured} onClick={sync}><FiRefreshCw />{busy ? 'Please wait…' : 'Refresh from Meta'}</button>}</header>
    {!session.provider.configured && <div className={s.windowNotice}>Connect WhatsApp before syncing or sending templates.</div>}
    {error && <div className={s.error} role="alert">{error}</div>}
    <div className={s.search}><FiSearch /><input aria-label="Search templates" placeholder="Search templates…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <div className={s.templateFilters}><select aria-label="Template category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{['MARKETING', 'UTILITY', 'AUTHENTICATION'].map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Template status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED', 'UNAVAILABLE'].map((value) => <option key={value}>{value}</option>)}</select><input aria-label="Template language code" placeholder="Language, e.g. en_US" value={language} maxLength={40} onChange={(event) => setLanguage(event.target.value)} /></div>
    <div className={s.templateGrid}><div className={s.templateList}>{loading ? <RowsSkeleton count={4} /> : !items.length ? <div className={s.empty}><FiFileText /><h2>No templates found</h2><p>{session.actor.admin ? 'Create a template in WhatsApp Manager, then refresh it here.' : 'Ask an administrator to sync approved templates.'}</p></div> : items.map((item) => <button key={item._id} className={selected?._id === item._id ? s.activeTemplate : ''} onClick={() => { setSelected(item); setValues({}); setError(''); }}><b>{item.name}</b><span>{item.language} · {item.category?.toLowerCase()} · {item.status?.toLowerCase()}</span><small className={s.mobileTemplateExcerpt}>{item.components?.find((component) => component.type === 'BODY')?.text}</small>{item.fields === null && <small>Contains components not yet supported by this composer</small>}</button>)}{moreLoading && <RowsSkeleton count={2} />}{next && <button className={s.loadMore} disabled={moreLoading} onClick={async () => { setMoreLoading(true); try { const result = await inboxApi(`/templates?${params}&before=${next}`); setItems((old) => [...old, ...result.items]); setNext(result.next); } catch (err) { setError(err.message); } finally { setMoreLoading(false); } }}>Load more templates</button>}</div>
      {selected && <form ref={preview} className={s.templatePreview} onSubmit={send}><h3>{selected.name}</h3><div className={s.templateBody}>{selected.components.map((component, index) => <p key={index}>{String(component.text || '').replace(/\{\{(\d+)\}\}/g, (_, position) => values[`${component.type.toLowerCase()}.${position}`] || `{{${position}}}`)}</p>)}</div>{selected.fields?.map((field) => <label key={field.key}>{field.component} variable {field.position}<input required maxLength={500} value={values[field.key] || ''} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} placeholder={`Value for {{${field.position}}}`} /></label>)}
      {conversation && <button className={s.primary} disabled={busy || !session.provider.configured || selected.status !== 'APPROVED' || selected.fields === null}>{busy ? <span className={s.mediaSpinner} aria-label="Sending template" /> : 'Send template'}</button>}{selected.fields === null && <p>This template uses media, buttons or named parameters. Choose a template with text components and numbered variables.</p>}</form>}
    </div>
  </div>;
}
