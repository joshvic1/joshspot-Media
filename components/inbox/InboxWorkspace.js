import NotificationSettings from './NotificationSettings';
import MessageStatus from './MessageStatus';
import { ChatSkeleton, RowsSkeleton } from './Skeleton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiInbox, FiUser, FiUsers, FiMail, FiClock, FiCheckCircle, FiFileText, FiSearch, FiPlus, FiMessageCircle, FiRefreshCw, FiSettings, FiSliders, FiArrowUpRight, FiMenu, FiX, FiBell } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi';
import { inboxApi, initials, relativeTime, fullDate } from './api';
import { useInboxConnection, useInboxRefresh } from './live';
import Notifications from './Notifications';
import Conversation from './Conversation';
import { useCrmNavigation } from '../crm/CrmLayout';
import Templates from './Templates';
import Modal from './Modal';
import MobileFilters from './MobileFilters';
import s from '../../styles/Inbox.module.css';

const views = [['inbox', 'Inbox', FiInbox], ['mine', 'Mine', FiUser], ['unassigned', 'Unassigned', FiUsers], ['unread', 'Unread', FiMail], ['follow_up', 'Follow up', FiClock], ['resolved', 'Resolved', FiCheckCircle], ['templates', 'Templates', FiFileText], ['contacts', 'Contacts', FiUsers]];
const destinations = [['inbox', 'Inbox', FiMessageCircle], ['contacts', 'Contacts', FiUser], ['templates', 'Templates', FiFileText], ['follow_up', 'Follow ups', FiClock], ['notifications', 'Notifications', FiBell], ['team', 'Team', FiUsers], ['settings', 'Settings', FiSettings]];

export default function InboxWorkspace({ session }) {
  useInboxConnection();
  const [targetNote, setTargetNote] = useState(null);
  const [notifications, setNotifications] = useState({ items: [], unread: 0, next: null, loading: !session.actor.admin });
  const notificationLoad = async (cursor) => { const result = await inboxApi(`/notifications${cursor ? `?before=${cursor}` : ''}`); setNotifications(old => ({ ...result, items: cursor ? [...old.items, ...result.items.filter(item => !old.items.some(row => row._id === item._id))] : result.items })); };
  useInboxRefresh(() => notificationLoad(), 'notifications', !session.actor.admin);
  const openCrmNavigation = useCrmNavigation();
  const [mobileFilters, setMobileFilters] = useState(false);
  const navigate = (key) => { setView(key); setSelected(null); setQuery(''); setAgent(''); setStatus(''); setFilters({}); };
  const [view, setView] = useState('inbox'); const [query, setQuery] = useState(''); const [search, setSearch] = useState('');
  const [agent, setAgent] = useState(''); const [status, setStatus] = useState('');
  const [filters, setFilters] = useState({}); const root = useRef(null);
  useEffect(() => {
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      root.current?.querySelectorAll('details[data-popover][open]').forEach((menu) => {
        if (event.type === 'keydown' || !menu.contains(event.target)) { menu.open = false; if (event.type === 'keydown') menu.querySelector('summary')?.focus(); }
      });
    };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);
  const [rows, setRows] = useState([]); const [next, setNext] = useState(null); const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const conversation = query.get('conversation'), message = query.get('message');
    if (/^[a-f0-9]{24}$/i.test(conversation || '')) { setSelected(conversation); setView('inbox'); if (/^[a-f0-9]{24}$/i.test(message || '')) setTargetNote(message); }
  }, []);
  const [newContact, setNewContact] = useState(false); const [saving, setSaving] = useState(false); const [contactError, setContactError] = useState('');
  const [notice, setNotice] = useState(''); const generation = useRef(0); const fetching = useRef(new Set()); const loaded = useRef(false); const expanded = useRef(false); const previous = useRef(null); const list = useRef(null);
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const load = useCallback(async (cursor, quiet = false) => {
    const current = generation.current;
    const requestKey = `${current}:${cursor || 'first'}`;
    if (fetching.current.has(requestKey)) return;
    fetching.current.add(requestKey);
    if (cursor) expanded.current = true;
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ view, q: search, agent, status, ...filters, ...(cursor ? { before: cursor } : {}) });
      const result = await inboxApi(`/conversations?${params}`);
      if (current !== generation.current) return;
      const latestInbound = result.items.map((row) => row.lastInboundId || '').sort().at(-1);
      if (!cursor) previous.current = latestInbound || previous.current;
      setRows((old) => cursor ? [...old, ...result.items.filter((item) => !old.some((row) => row._id === item._id))] : quiet && old.length > 20 ? [...result.items, ...old.filter(row => !result.items.some(item => item._id === row._id))] : result.items);
      if (!quiet || !expanded.current) setNext(result.next); loaded.current = true; setError('');
      if (!cursor && window.matchMedia('(min-width: 901px)').matches) {
        setSelected((current) => current || result.items[0]?._id || null);
      }
    } catch (err) { if (current === generation.current) setError(err.message); return false; }
    finally { fetching.current.delete(requestKey); if (current === generation.current) setLoading(false); }
  }, [view, search, agent, status, filters]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const selectForDesktop = () => { if (media.matches && rows.length) setSelected((current) => current || rows[0]._id); };
    media.addEventListener('change', selectForDesktop);
    return () => media.removeEventListener('change', selectForDesktop);
  }, [rows]);
  const refreshCounts = useCallback(() => inboxApi('/counts').then(setCounts).catch(() => {}), []);
  const listEnabled = !['templates', 'team', 'settings', 'notifications'].includes(view);
  useEffect(() => {
    generation.current += 1; previous.current = null; loaded.current = false; expanded.current = false; setRows([]); setNext(null);
    if (list.current) list.current.scrollTop = 0;
    return () => { generation.current += 1; };
  }, [load]);
  useInboxRefresh(async () => { const result = await load(null, loaded.current); await refreshCounts(); return result; }, JSON.stringify([view, search, agent, status, filters]), listEnabled);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  const refresh = () => { expanded.current = false; load(); refreshCounts(); };
  const createContact = async (event) => {
    event.preventDefault(); setSaving(true); setContactError('');
    const data = new FormData(event.currentTarget);
    try { const result = await inboxApi('/contacts', { method: 'POST', body: { name: data.get('name'), phone: data.get('phone') } }); setNewContact(false); setSelected(result.id); setView('inbox'); refresh(); }
    catch (err) { setContactError(err.message); } finally { setSaving(false); }
  };
  return <div ref={root} className={`${s.workspace} ${selected ? s.hasSelection : ''}`}>
    <header className={s.mobileAppBar}><span><b>Joshspot Inbox</b></span><button className={s.iconButton} aria-label="Open CRM navigation" onClick={openCrmNavigation}><FiMenu /></button></header>
    <aside className={s.rail} aria-label="Inbox navigation"><button className={s.wordmark} title="Open CRM navigation" aria-label="Open CRM navigation" onClick={openCrmNavigation}><FiMessageCircle /></button>
      <nav>{destinations.map(([key, title, Icon]) => { const active = view === key || key === 'inbox' && ['mine', 'unassigned', 'unread', 'resolved'].includes(view); return <button key={key} title={title} aria-label={title} className={active ? s.active : ''} aria-current={active ? 'page' : undefined} onClick={() => { setView(key); setSelected(null); setQuery(''); setAgent(''); setStatus(''); setFilters({}); }}><Icon />{key === 'notifications' && notifications.unread > 0 && <b className={s.notificationBadge}>{notifications.unread}</b>}<span className={s.railTooltip}>{title}</span>{key === 'inbox' && counts.unread > 0 && <i className={s.railDot} />}</button>; })}</nav>
      <div className={s.railProfile} title={`${session.actor.name} · ${session.actor.role}`}>{initials(session.actor.name)}</div>
      <button className={s.connection} title={session.provider.configured ? 'WhatsApp configured' : 'WhatsApp not connected'} aria-label="Connection settings" onClick={() => { setView('settings'); setSelected(null); }}><i className={session.provider.configured ? s.ready : ''} /></button>
    </aside>
    {view === 'notifications' ? <Notifications onRead={(id) => setNotifications(old => ({...old, unread:id?Math.max(0,old.unread-1):0, items:old.items.map(item => !id||item._id===id?{...item,readAt:item.readAt||new Date().toISOString()}:item)}))} data={notifications} onMore={() => notificationLoad(notifications.next)} onOpen={(target) => { setTargetNote(target.message); setSelected(target.conversation); setView('inbox'); notificationLoad(); }} /> : view === 'templates' ? <section className={s.catalogue}><Templates session={session} /></section> : view === 'team' ? <section className={s.catalogue}><header className={s.sectionHeading}><h1>Team</h1><span>{session.staff.length} representatives</span></header><div className={s.teamGrid}>{session.staff.map((person) => <article key={person._id} className={s.teamPerson}><span className={s.avatar}>{initials(person.name)}</span><div><b>{person.name}</b><small>{person.role}{person._id === session.actor.id ? ' · You' : ''}</small></div></article>)}</div></section> : view === 'settings' ? <section className={s.catalogue}><header className={s.sectionHeading}><h1>Settings</h1></header><NotificationSettings />{session.actor.admin&&<div className={s.connectionCard}><FaWhatsapp /><div><h2>WhatsApp Business</h2><p>{session.provider.configured ? 'Configured · Delivery is confirmed by message receipts.' : 'Not connected'}</p>{!session.provider.configured && <p>{session.actor.admin ? 'Add the Meta credentials to your backend environment, then configure your webhook.' : 'Ask your administrator to connect WhatsApp.'}</p>}{session.actor.admin && session.provider.missing?.length > 0 && <ul>{session.provider.missing.map((name) => <li key={name}>{name}</li>)}</ul>}{session.actor.admin && <a href="https://business.facebook.com/wa/manage/home/" target="_blank" rel="noreferrer">WhatsApp Manager <FiArrowUpRight /></a>}{session.provider.failedJobs > 0 && <div className={s.error}>{session.provider.failedJobs} webhooks need attention.<button onClick={async () => { try { await inboxApi('/webhooks/retry', { method: 'POST', body: {} }); setNotice('Webhooks queued for another attempt'); } catch (err) { setError(err.message); } }}><FiRefreshCw />Retry processing</button></div>}{error && <div className={s.error} role="alert">{error}</div>}</div></div>}</section> : <>
      <section className={s.listPanel} aria-label="Conversations">
        <header className={s.listHeader}>{view === 'contacts' ? <h1>Contacts</h1> : <div className={s.folderTabs} aria-label="Conversation views"><button disabled={!session.actor.admin && session.actor.role==='CSS'} aria-pressed={view !== 'mine'} onClick={() => navigate('inbox')}>{status ? status.replace('_', ' ') : view === 'mine' || view === 'inbox' ? (agent || Object.values(filters).some(Boolean) ? 'Filtered' : !session.actor.admin && session.actor.role==='CSS' ? 'Assigned to me' : 'All') : views.find(([key]) => key === view)?.[1] || 'All'}</button><span aria-hidden="true" /><button aria-pressed={view === 'mine'} onClick={() => navigate('mine')}>Mine</button></div>}<button className={s.iconButton} title="New conversation" aria-label="New conversation" onClick={() => setNewContact(true)}><FiPlus /></button></header>
        <div className={s.searchControls}><div className={s.search}><FiSearch /><input aria-label="Search conversations" placeholder="Search conversations…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button className={`${s.iconButton} ${s.searchClear}`} aria-label="Clear search" onClick={() => setQuery('')}><FiX /></button>}</div><button className={`${s.iconButton} ${s.searchFilter}`} aria-label="Filter conversations" onClick={() => setMobileFilters(true)}><FiSliders />{(agent || status || Object.values(filters).some(Boolean) || !['inbox','contacts','mine'].includes(view)) && <i />}</button></div>
        {error && <div className={s.error} role="alert">{error}<button onClick={() => load()}>Retry</button></div>}
        <div className={s.list} ref={list} aria-busy={loading} onScroll={(event) => { const el = event.currentTarget; if (next && !loading && el.scrollTop > 0 && el.scrollHeight - el.scrollTop - el.clientHeight < 160) load(next); }}>
          {loading && !rows.length ? <RowsSkeleton /> : !rows.length ? <div className={s.empty}><FiInbox /><h2>{search ? 'No matching conversations' : 'A clear inbox'}</h2><p>{search ? 'Try a name, phone number, label or message keyword.' : 'Customer conversations will appear here when messages arrive.'}</p></div> : rows.map((row) => <button key={row._id} className={`${s.row} ${row._id === selected ? s.selected : ''} ${row.unread ? s.unread : ''}`} onClick={() => { setTargetNote(null); setSelected(row._id); }} aria-pressed={row._id === selected}>
            <span className={s.avatar}>{initials(row.contact?.name || row.contact?.phone)}</span><span className={s.rowBody}><span className={s.rowTitle}><strong>{row.contact?.name || `+${row.contact?.phone}`}</strong><time title={fullDate(row.lastMessageAt)}>{relativeTime(row.lastMessageAt)}</time></span><span className={s.preview}>{view !== 'contacts' && row.previewStatus && <MessageStatus status={row.previewStatus} />}{view === 'contacts' ? `+${row.contact?.phone} · ${row.contact?.email || row.contact?.status}` : row.preview || 'Start a conversation'}{row.unread && <i aria-label="Unread" />}</span><span className={s.rowMeta}>{row.ai?.priority && <small className={s.aiPayment}>Payment</small>}{row.ai?.needsHuman && <small>Needs human</small>}{row.status === 'follow_up' && row.followUpAt ? <small title={fullDate(row.followUpAt)} className={new Date(row.followUpAt) < new Date() ? s.overdue : ''}><FiClock />{new Date(row.followUpAt) < new Date() ? 'Due' : new Date(row.followUpAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small> : row.labels?.[0] && <small>{row.labels[0]}</small>}{!row.assignedTo && <span className={s.unassignedSparkle} role="img" aria-label="Unassigned conversation" title="Unassigned"><HiOutlineSparkles aria-hidden="true" /></span>}</span></span>
          </button>)}
          {next && (loading ? <RowsSkeleton count={2} /> : <button className={s.loadMore} onClick={() => load(next)}>Load more</button>)}
        </div>
      </section>
      {selected ? <Conversation key={selected} id={selected} targetNote={targetNote} session={session} onBack={() => setSelected(null)} onDeleted={deletedId=>{generation.current++;setRows(old=>old.filter(row=>row._id!==deletedId));setSelected(null);setTargetNote(null);}} onUpdate={refresh} /> : loading ? <ChatSkeleton /> : <div className={s.conversationWorkspace}><section className={s.welcome}><div className={s.welcomeIcon}><FiMessageCircle /></div><h2>Select a conversation</h2>{!session.provider.configured && <button className={s.secondary} onClick={() => setView('settings')}>Connect WhatsApp <FiArrowUpRight /></button>}</section><aside className={`${s.customerPanel} ${s.emptyCustomer}`} aria-label="Customer details"><header>Contact details</header><div className={s.empty}><FiUser /><p>Select a conversation to view customer information.</p></div></aside></div>}
    </>}
    <nav className={s.mobileBottom} aria-label="Mobile Inbox navigation">{[['inbox','Inbox',FiMessageCircle],['follow_up','Follow up',FiClock],['notifications','Alerts',FiBell],['settings','Settings',FiSettings]].map(([key,label,Icon]) => <button key={key} aria-current={view === key || key === 'inbox' && ['mine','unread','unassigned','resolved'].includes(view) ? 'page' : undefined} onClick={() => navigate(key)}><span><Icon />{key === 'notifications' && notifications.unread > 0 && <b className={s.notificationBadge}>{notifications.unread > 99 ? '99+' : notifications.unread}</b>}</span>{label}</button>)}</nav>
    {mobileFilters && <MobileFilters session={session} view={view} agent={agent} status={status} filters={filters} onClose={() => setMobileFilters(false)} onApply={(values) => { setView(values.view); setSelected(null); setAgent(values.agent); setStatus(values.status); setFilters(values.filters); setMobileFilters(false); }} />}

    <div className={s.toast} role="status" aria-live="polite">{notice}</div>
    {newContact && <Modal title="New conversation" onClose={() => setNewContact(false)}><form className={s.form} onSubmit={createContact}><label>Name<input name="name" maxLength={120} placeholder="Customer name" /></label><label>WhatsApp number<input name="phone" type="tel" required placeholder="+234 801 234 5678" /></label><p>Use a country code for international numbers. Existing contacts are matched automatically.</p>{contactError && <div role="alert" className={s.error}>{contactError}</div>}<button className={s.primary} disabled={saving}>{saving ? <span className={s.mediaSpinner} aria-label="Opening conversation" /> : 'Open conversation'}</button></form></Modal>}
  </div>;
}
