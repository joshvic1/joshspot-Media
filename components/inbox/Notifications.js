import { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { inboxApi, relativeTime } from './api';
import s from '../../styles/Inbox.module.css';
export default function Notifications({ data, onOpen, onMore }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <section className={s.catalogue}><header className={s.sectionHeading}><h1>Notifications</h1><span>{data.unread || 0} unread</span></header>
    {error && <p role="alert" className={s.error}>{error}</p>}
    {!data.items.length && <div className={s.empty}><FiBell /><h2>You’re all caught up</h2><p>When a teammate mentions you in an internal note, it appears here.</p></div>}
    {data.items.map(item => <button key={item._id} className={`${s.notificationRow} ${!item.readAt ? s.notificationUnread : ''}`} disabled={busy} onClick={async () => {
      setBusy(true); setError(''); try { const target = await inboxApi(`/notifications/${item._id}/read`, { method: 'POST', body: {} }); onOpen(target); } catch (err) { setError(err.message); } finally { setBusy(false); }
    }}><FiBell /><span><strong>{item.authorName} mentioned you</strong><small>Open the internal note · {relativeTime(item.createdAt)}</small></span>{!item.readAt && <i aria-label="Unread" />}</button>)}
    {data.next && <button className={s.loadMore} disabled={busy} onClick={async () => { setBusy(true); try { await onMore(); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>Load more notifications</button>}
  </section>;
}
