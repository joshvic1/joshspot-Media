import {useState} from 'react';
import {FiMessageSquare,FiArrowRight,FiLock,FiSearch} from 'react-icons/fi';
import {inboxApi,initials} from './api';
import Modal from './Modal';
import s from '../../styles/Inbox.module.css';
import c from '../../styles/StaffChat.module.css';
export default function StaffChatSettings({session,onOpen}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const people=session.staff.filter(p=>p._id!==session.actor.id&&!(session.actor.admin&&p.role==='ADMIN')&&p.name.toLowerCase().includes(query.toLowerCase()));
 async function start(person){setBusy(person._id);setError('');try{const row=await inboxApi('/staff-chats',{method:'POST',body:{recipient:person._id}});setOpen(false);onOpen(row._id);}catch(e){setError(e.message);}finally{setBusy('');}}
 return <><button type="button" className={c.settingsCard} onClick={()=>setOpen(true)}><span className={c.cardIcon}><FiMessageSquare/></span><span><strong>Staff chats</strong><small>Message a teammate privately</small></span><FiArrowRight/></button>{open&&<Modal title="New staff chat" onClose={()=>setOpen(false)}><div className={c.directory}><p><FiLock/> Private between you and your teammate.</p><label className={c.search}><FiSearch/><input aria-label="Search teammates" placeholder="Find a teammate…" value={query} onChange={e=>setQuery(e.target.value)}/></label>{error&&<p role="alert" className={s.error}>{error}</p>}{people.map(person=><button key={person._id} disabled={Boolean(busy)} onClick={()=>start(person)}><span className={c.avatar}>{initials(person.name)}</span><span><strong>{person.name}</strong><small>{person.role==='ADMIN'?'Administrator':person.role==='SS'?'Sales':'Customer support'}</small></span>{busy===person._id?<span className={s.sendSpinner}/>:<FiArrowRight/>}</button>)}{!people.length&&<p>No matching teammates.</p>}</div></Modal>}</>;
}
