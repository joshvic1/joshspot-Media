import { useId, useState } from 'react';
import { FiInbox, FiUser, FiUsers, FiMail, FiClock, FiCheckCircle } from 'react-icons/fi';
import Modal from './Modal';
import s from '../../styles/Inbox.module.css';
const folders = [['inbox','All',FiInbox],['mine','Mine',FiUser],['unassigned','Unassigned',FiUsers],['unread','Unread',FiMail],['follow_up','Follow up',FiClock],['resolved','Resolved',FiCheckCircle]];
export default function MobileFilters({ session, view, agent, status, filters, onApply, onClose }) {
  const id = useId();
  const [draft, setDraft] = useState({ view: view === 'contacts' ? 'inbox' : view, agent, status, filters: { ...filters } });
  const field = (key, value) => setDraft((old) => ({ ...old, filters: { ...old.filters, [key]: value } }));
  return <Modal title="Filter conversations" onClose={onClose} footer={<><button type="button" className={s.secondary} onClick={() => setDraft({ view: 'inbox', agent: '', status: '', filters: {} })}>Reset</button><button type="submit" form={id} className={s.primary}>Apply filters</button></>}>
    <form id={id} className={s.sheetFilterForm} onSubmit={(event) => { event.preventDefault(); onApply(draft); }}>
      <fieldset><legend>Show conversations</legend><div className={s.folderChoices}>{folders.map(([key,label,Icon]) => <label key={key} className={draft.view === key ? s.folderChosen : ''}><input type="radio" name="folder" value={key} checked={draft.view === key} onChange={() => setDraft({ ...draft, view: key })} /><Icon /><span>{label}</span></label>)}</div></fieldset>
      <label>Assigned to<select value={draft.agent} onChange={(event) => setDraft({ ...draft, agent: event.target.value })}><option value="">Anyone</option><option value="unassigned">Unassigned</option>{session.staff.filter((person) => session.actor.admin || person._id === session.actor.id).map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}</select></label>
      <label>Label<input value={draft.filters.label || ''} maxLength={40} placeholder="e.g. Hot lead" onChange={(event) => field('label',event.target.value)} /></label>
      <details className={s.advancedFilters}><summary>More filters <span>Source, status & channel</span></summary><div>
        <label>Lead source<input value={draft.filters.source || ''} maxLength={120} placeholder="Any source" onChange={(event) => field('source',event.target.value)} /></label>
        <label>Conversation status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="">Any status</option><option value="open">Open</option><option value="follow_up">Follow up</option><option value="resolved">Resolved</option></select></label>
        <label>Customer status<select value={draft.filters.customerStatus || ''} onChange={(event) => field('customerStatus',event.target.value)}><option value="">Any status</option><option value="lead">Lead</option><option value="customer">Customer</option><option value="inactive">Inactive</option></select></label>
        <label>Channel<select aria-label="Channel" defaultValue="whatsapp"><option value="whatsapp">WhatsApp</option></select></label>
      </div></details>
    </form>
  </Modal>;
}
