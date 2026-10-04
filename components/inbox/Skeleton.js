import s from '../../styles/Inbox.module.css';
export function RowsSkeleton({ count = 6 }) {
  return <div className={s.skeletonRows} role="status" aria-label="Loading" aria-busy="true">{Array.from({ length: count }, (_, i) => <div className={s.skeletonRow} key={i} aria-hidden="true"><i /><div><b /><span /></div></div>)}</div>;
}
export function ChatSkeleton() {
  return <div className={s.conversationWorkspace} role="status" aria-label="Loading conversation" aria-busy="true"><section className={`${s.chat} ${s.skeletonChat}`}><RowsSkeleton count={1} /><div className={s.skeletonTimeline} aria-hidden="true"><i /><i /><i /></div><div className={s.skeletonComposer} aria-hidden="true" /></section></div>;
}
export default function InboxSkeleton() {
  return <div className={`${s.workspace} ${s.skeletonWorkspace}`} aria-busy="true" aria-label="Loading Inbox" role="status"><header className={s.mobileAppBar}><span><b>Joshspot Inbox</b></span></header><aside className={s.rail} aria-hidden="true" /><section className={s.listPanel}><div className={s.skeletonToolbar} aria-hidden="true" /><RowsSkeleton /></section><ChatSkeleton /></div>;
}
