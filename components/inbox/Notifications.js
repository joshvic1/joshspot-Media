import { RowsSkeleton } from './Skeleton';
import { useState } from 'react';
import { FiBell, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { inboxApi, relativeTime } from './api';
import s from '../../styles/Inbox.module.css';
export default function Notifications({ data, onOpen, onMore, onRead }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const markRead = async (item, open = false) => {
    setBusy(true); setError('');
    try {
      const target = await inboxApi(item ? `/notifications/${item._id}/read` : '/notifications/read-all', { method: 'POST', body: {} });
      if (!item || !item.readAt) onRead(item?._id);
      if (open) onOpen(target);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <section className={s.catalogue}><header className={`${s.sectionHeading} ${s.notificationHeading}`}><div><h1>Notifications</h1><span>{data.unread || 0} unread</span></div><button className={s.notificationReadAll} disabled={busy || !data.unread} onClick={() => markRead()}><FiCheckCircle />Mark all as read</button></header>
    {error && <p role="alert" className={s.error}>{error}</p>}
    {data.loading && <RowsSkeleton />}
    {!data.loading && !data.items.length && <div className={s.empty}><FiBell /><h2>You’re all caught up</h2><p>When a teammate mentions you in an internal note, it appears here.</p></div>}
    {data.items.map(item => <div key={item._id} className={`${s.notificationRow} ${!item.readAt ? s.notificationUnread : ''}`}>
      <button className={s.notificationOpen} disabled={busy} onClick={() => markRead(item, true)}><FiBell /><span><strong>{item.contactName || 'Contact'}</strong><small>{item.authorName || 'A teammate'} {item.kind==='handoff'?'requested your help':'mentioned you'} · {relativeTime(item.createdAt)}</small></span>{!item.readAt && <i aria-label="Unread" />}</button>
      {!item.readAt && <button className={s.notificationReadOne} disabled={busy} title="Mark as read" aria-label={`Mark notification from ${item.authorName || 'teammate'} as read`} onClick={() => markRead(item)}><FiCheck /></button>}
    </div>)}
    {data.next && <button className={s.loadMore} disabled={busy} onClick={async () => { setBusy(true); try { await onMore(); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>{busy ? <RowsSkeleton count={1} /> : 'Load more notifications'}</button>}
  </section>;
}
