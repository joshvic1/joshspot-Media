import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { FiArrowLeft, FiCheck, FiInfo, FiMessageCircle, FiLock, FiMoreHorizontal, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { inboxApi, initials, shortTime, isReplyWindowOpen, dayLabel } from './api';
import { useInboxRefresh } from './live';
import Composer from './Composer';
import CustomerDetails from './CustomerDetails';
import Modal from './Modal';
import MediaAttachment from './MediaAttachment';
import s from '../../styles/Inbox.module.css';
const subscribeWide = (callback) => { const media = window.matchMedia('(min-width: 1280px)'); media.addEventListener('change', callback); return () => media.removeEventListener('change', callback); };
const getWide = () => window.matchMedia('(min-width: 1280px)').matches;
function noteText(message, staff) {
  const names = (message.mentions || []).map(id => staff.find(person => person._id === id)?.name).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!names.length || message.type !== 'note') return message.text;
  const text = message.text || ''; const parts = []; let start = 0;
  for (let i = 0; i < text.length; i++) {
    const name = names.find(value => text.startsWith(`@${value}`, i));
    if (!name) continue;
    parts.push(text.slice(start, i), <strong key={i}>@{name}</strong>); i += name.length; start = i + 1;
  }
  parts.push(text.slice(start)); return parts;
}

export default function Conversation({ id, targetNote, session, onBack, onUpdate }) {
  const [conversation, setConversation] = useState(null); const [messages, setMessages] = useState([]);
  const [more, setMore] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [details, setDetails] = useState(false); const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false); const [schedule, setSchedule] = useState(false);
  const wide = useSyncExternalStore(subscribeWide, getWide, () => false);
  const showDetails = wide ? !collapsed : details;
  const toggleDetails = () => wide ? setCollapsed(!collapsed) : setDetails(!details);
  const scroll = useRef(null); const alive = useRef(true); const nearBottom = useRef(true); const lastRead = useRef(''); const inFlight = useRef(null); const latest = useRef(null); const initialized = useRef(false);
  const historyPage = useRef(null); const changes = useRef(null); const [withinDay, setWithinDay] = useState(false);
  const [highlight, setHighlight] = useState(null); const target = useRef(targetNote); const epoch = useRef(0);
  const merge = (items, updates = false) => { const priorLatest = latest.current; setMessages(old => {
    const map = new Map(old.map(message => [message._id, message]));
    items.forEach(message => { if (!updates || map.has(message._id) || !priorLatest || message._id > priorLatest) map.set(message._id, message); });
    return [...map.values()].sort((a, b) => a._id.localeCompare(b._id));
  }); };
  const load = useCallback(async () => {
    const version = epoch.current;
    if (inFlight.current === version) return;
    inFlight.current = version;
    try {
      const initial = !initialized.current;
      const query = initial ? (target.current ? `?target=${target.current}` : '') : `?changes=${encodeURIComponent(changes.current)}`;
      const [item, result] = await Promise.all([inboxApi(`/conversations/${id}`), inboxApi(`/conversations/${id}/messages${query}`)]);
      if (!alive.current || version !== epoch.current) return;
      setConversation(item); setError('');
      if (initial) {
        setMessages(result.items); historyPage.current = result.next; setMore(result.more); setWithinDay(result.withinDay);
        initialized.current = true;
        if (target.current) { nearBottom.current = false; setHighlight(target.current); }
      } else merge(result.items, true);
      changes.current = result.changes;
      latest.current = [...result.items.map(message => message._id), latest.current || ''].sort().at(-1);
      // Drain bounded delta pages after reconnects without losing a burst of messages.
      let page = result; let batches = 0;
      while (!initial && page.more && batches++ < 10) {
        page = await inboxApi(`/conversations/${id}/messages?changes=${encodeURIComponent(changes.current)}`);
        if (!alive.current || version !== epoch.current) return;
        merge(page.items, true); changes.current = page.changes;
        latest.current = [...page.items.map(message => message._id), latest.current || ''].sort().at(-1);
      }
      if (!initial && page.more) window.dispatchEvent(new Event('inbox-update'));
      const inbound = item.lastInboundId;
      if (inbound && nearBottom.current && !document.hidden && lastRead.current !== inbound) {
        await inboxApi(`/conversations/${id}/read`, { method: 'POST', body: { messageId: inbound } }); lastRead.current = inbound;
      }
    } catch (err) { if (alive.current && version === epoch.current) setError(err.message); throw err; }
    finally { if (inFlight.current === version) inFlight.current = null; if (alive.current && version === epoch.current) setLoading(false); }
  }, [id]);
  useEffect(() => {
    alive.current = true; initialized.current = false; target.current = targetNote; changes.current = null;
    latest.current = null; setMessages([]); setLoading(true); epoch.current++;
    return () => { alive.current = false; };
  }, [id, targetNote]);
  useInboxRefresh(load, `${id}:${targetNote || ''}`);
  useEffect(() => {
    if (!highlight) return;
    const timer = setTimeout(() => document.getElementById(`message-${highlight}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
    return () => clearTimeout(timer);
  }, [highlight]);
  useEffect(() => { if (nearBottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [messages]);
  const refresh = async () => { await load(); onUpdate(); };
  const update = async (changes) => {
    setSaving(true); setError('');
    try { await inboxApi(`/conversations/${id}`, { method: 'PUT', body: { revision: conversation.revision, ...changes } }); await refresh(); return true; }
    catch (err) { if (err.status === 409) await load().catch(() => {}); setError(err.message); return false; }
    finally { setSaving(false); }
  };
  const olderBusy = useRef(false);
  const older = async () => {
    if (olderBusy.current || !historyPage.current) return;
    olderBusy.current = true; setSaving(true); const height = scroll.current?.scrollHeight || 0; const top = scroll.current?.scrollTop || 0;
    try {
      const result = await inboxApi(`/conversations/${id}/messages?page=${encodeURIComponent(historyPage.current)}`);
      if (!alive.current) return;
      nearBottom.current = false;
      merge(result.items); historyPage.current = result.next; setMore(result.more); setWithinDay(result.withinDay);
      requestAnimationFrame(() => { if (scroll.current) scroll.current.scrollTop = top + scroll.current.scrollHeight - height; });
    } catch (err) { setError(err.message); } finally { olderBusy.current = false; setSaving(false); }
  };
  const canReply = Boolean(conversation && (session.actor.admin || conversation.assignedTo === session.actor.id));
  if (loading && !conversation) return <section className={s.chat}><div className={s.skeleton} /><div className={s.empty}>Loading conversation…</div></section>;
  if (!conversation) return <section className={s.chat}><button className={s.back} onClick={onBack}><FiArrowLeft /> Back</button><div className={s.error} role="alert">{error || 'Conversation unavailable'}<button onClick={() => load().catch((err) => setError(err.message))}>Retry</button></div></section>;
  return <div className={s.conversationWorkspace}><section className={s.chat} aria-label={`Conversation with ${conversation.contact.name || conversation.contact.phone}`}>
    <header className={s.chatHeader}><button className={`${s.iconButton} ${s.mobileBack}`} aria-label="Back to conversations" onClick={onBack}><FiArrowLeft /></button><button className={`${s.avatar} ${s.avatarButton}`} aria-label="Open customer profile" onClick={toggleDetails}>{initials(conversation.contact.name || conversation.contact.phone)}</button><button className={s.customerTitle} onClick={toggleDetails}><strong>{conversation.contact.name || `+${conversation.contact.phone}`}</strong><span><FaWhatsapp /> WhatsApp · +{conversation.contact.phone}</span></button><div className={s.chatTools}><select aria-label="Assigned representative" disabled={!session.actor.admin || saving} value={conversation.assignedTo || ''} onChange={(event) => update({ assignedTo: event.target.value || null })}><option value="">Unassigned</option>{session.staff.map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}</select>{!session.actor.admin && !conversation.assignedTo && <button onClick={() => update({ assignedTo: session.actor.id })} disabled={saving}>Assign to me</button>}{conversation.status === 'follow_up' && <button disabled={!canReply || saving} onClick={() => update({ status: 'open' })}>Clear follow-up</button>}</div><span className={s.conversationBadge}>{conversation.status.replace('_', ' ')}</span><button className={s.iconButton} aria-label="Customer details" aria-expanded={showDetails} title="Customer details" onClick={toggleDetails}><FiInfo /></button><details data-popover className={s.actionMenu}><summary aria-label="Conversation actions" title="Conversation actions"><FiMoreHorizontal /></summary><div><button disabled={!canReply} onClick={(event) => { event.currentTarget.closest('details').open = false; setSchedule(true); }}><FiClock />Schedule follow-up</button><button disabled={!canReply || saving} onClick={(event) => { event.currentTarget.closest('details').open = false; update({ status: conversation.status === 'resolved' ? 'open' : 'resolved' }); }}><FiCheck />{conversation.status === 'resolved' ? 'Reopen conversation' : 'Resolve conversation'}</button></div></details></header>

    {error && <div className={s.error} role="alert">{error}<button onClick={() => refresh().catch((err) => setError(err.message))}>Refresh</button></div>}
    <div className={s.messages} ref={scroll} onScroll={() => { const element = scroll.current; nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100; }}>
      {highlight && <button className={s.loadMore} onClick={() => { target.current = null; setHighlight(null); initialized.current = false; nearBottom.current = true; load().catch(() => {}); }}>Back to latest messages</button>}
      {more && <button className={s.loadMore} disabled={saving} onClick={older}>{withinDay ? 'Load more from this 24-hour period' : 'Load previous 24 hours'}</button>}
      {!messages.length && <div className={s.empty}><FiMessageCircle /><h2>No messages in the last 24 hours</h2><p>Load previous messages above, or start a new reply when available.</p></div>}
      {messages.map((message, index) => {
        const date = dayLabel(message.occurredAt || message.createdAt);
        const previousDate = index > 0 ? dayLabel(messages[index - 1].occurredAt || messages[index - 1].createdAt) : null;
        return <div key={message._id} id={`message-${message._id}`} className={highlight === message._id ? s.highlightNote : undefined}>{date !== previousDate && <div className={s.date}><span>{date}</span></div>}{message.type === 'activity' ? <p className={s.activity}>{message.authorName} · {message.text} · {shortTime(message.createdAt)}</p> : <article className={`${s.bubble} ${message.direction === 'outbound' ? s.outbound : ''} ${message.type === 'note' ? s.note : ''}`}>
          {message.type === 'note' && <b className={s.messageLabel}><FiLock /> Internal note · {message.authorName}</b>}{message.type === 'template' && <b className={s.messageLabel}>WhatsApp template</b>}
          {message.media?.id && <MediaAttachment conversationId={id} message={message} onError={setError} />}
          <div className={s.messageText}>{noteText(message, session.staff)}</div><footer><span>{message.direction === 'outbound' && message.authorName ? `${message.authorName} · ` : ''}{shortTime(message.occurredAt || message.createdAt)}</span>{message.direction === 'outbound' && <span className={message.status === 'read' ? s.read : ''} title={message.status}>{['sent', 'delivered', 'read'].includes(message.status) && <FiCheck />}{message.status}</span>}</footer>
          {message.error && <div className={s.sendError}>{message.error}{message.status === 'failed' && canReply && <button onClick={async () => { try { await inboxApi(`/conversations/${id}/messages/${message._id}/retry`, { method: 'POST', body: {} }); await refresh(); } catch (err) { setError(err.message); } }}>Retry message</button>}</div>}
        </article>}</div>;
      })}
    </div>
    <Composer conversation={conversation} session={session} canReply={canReply} windowOpen={isReplyWindowOpen(conversation.lastInboundAt)} onSent={async () => { nearBottom.current = true; await refresh(); }} />
  </section>{showDetails && <CustomerDetails conversation={conversation} session={session} canEdit={canReply} onClose={toggleDetails} onUpdate={refresh} onChange={update} inline={wide} />}{schedule && <Modal title="Schedule follow-up" onClose={() => setSchedule(false)}><form className={s.form} onSubmit={async (event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get('when'); if (await update({ followUpAt: new Date(value).toISOString() })) setSchedule(false); }}><label>Date and time<input name="when" type="datetime-local" required /></label><p>Uses your device’s local time.</p>{error && <div className={s.error} role="alert">{error}</div>}<button className={s.primary} disabled={saving}>Schedule follow-up</button></form></Modal>}</div>;
}

