import { useEffect, useState } from 'react';
import { FiCornerUpLeft, FiBookmark, FiCopy, FiCheck } from 'react-icons/fi';
import Modal from './Modal';
import MessageReactions from './MessageReactions';
import { inboxApi, fullDate } from './api';
import s from '../../styles/Inbox.module.css';
export default function MessageMenu({message,conversationId,session,canReply,onReply,onClose,onUpdate}) {
 const [quickOpen,setQuickOpen]=useState(false),[keyword,setKeyword]=useState(''),[response,setResponse]=useState(message.text||''),[saved,setSaved]=useState('');
 const [info,setInfo]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 useEffect(()=>{let active=true;if(message.media?.id)inboxApi(`/conversations/${conversationId}/messages/${message._id}/media-info`).then(data=>{if(active)setInfo(data);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[conversationId,message._id,message.media?.id]);
 const replyable=canReply&&message.providerId&&message.direction!=='internal'&&!['queued','sending','failed','unknown'].includes(message.status);
 return <Modal title="Message actions" onClose={onClose}><div className={s.messageMenuBody}>
 <p className={s.messageMenuPreview}>{message.text||`[${message.type}]`}</p>
 <MessageReactions menuMode message={message} conversationId={conversationId} actor={session.actor} canReply={canReply} onUpdate={async()=>{await onUpdate();onClose();}} onError={setError}/>
 {message.text&&<button className={s.messageMenuItem} onClick={async()=>{setError('');try{await navigator.clipboard.writeText(message.text);setCopied(true);}catch{setError('Could not copy this message. Please allow clipboard access and try again.');}}}>{copied?<FiCheck/>:<FiCopy/>}<span aria-live="polite">{copied?'Copied':'Copy'}</span></button>}
 {session.actor.admin&&message.text?.trim()&&<>
 <button className={s.messageMenuItem} disabled={busy} onClick={()=>{setQuickOpen(!quickOpen);setError('');setSaved('');}}><FiBookmark/>Save to Quick Replies</button>
 {quickOpen&&<form className={s.form} onSubmit={async event=>{event.preventDefault();if(busy)return;setBusy(true);setError('');try{const item=await inboxApi('/quick-replies',{method:'POST',body:{keyword,response}});setSaved(item.keyword);setQuickOpen(false);window.dispatchEvent(new Event('inbox-quick-replies-changed'));}catch(e){setError(e.message);}finally{setBusy(false);}}}>
 <label>Keyword<input aria-label="Keyword" autoFocus value={keyword} onChange={e=>setKeyword(e.target.value)} required maxLength={41} pattern="/?[a-zA-Z0-9_-]{1,40}" placeholder="e.g. setup" disabled={busy}/></label>
 <label>Response<textarea aria-label="Response" rows={5} value={response} onChange={e=>setResponse(e.target.value)} required maxLength={4096} disabled={busy}/></label>
 <button className={s.primary} disabled={busy||!response.trim()}>{busy?'Saving…':'Save quick reply'}</button>
 </form>}
 {saved&&<p role="status">Saved as /{saved}. Type / in the message box to use it.</p>}
 </>}
 {replyable&&<button className={s.messageMenuItem} onClick={()=>{onReply(message);onClose();}}><FiCornerUpLeft/>Reply</button>}
 {message.media?.id&&<button className={s.messageMenuItem} disabled={busy||!info||(info.keep&&info.state!=='failed')} onClick={async()=>{setBusy(true);setError('');try{setInfo(await inboxApi(`/conversations/${conversationId}/messages/${message._id}/media-keep`,{method:'PUT',body:{keep:true}}));}catch(e){setError(e.message);}finally{setBusy(false);}}}><FiBookmark/>{busy?'Saving…':info?.keep?(info.state==='ready'?'Media saved':info.state==='failed'?'Retry saving media':'Keep requested'):'Keep media'}</button>}
 {session.actor.admin&&message.direction==='outbound'&&message.author!=='ai'&&<details className={s.promoteResponse}><summary>Save response</summary>{[['knowledge','Add to knowledge'],['tone','Add tone example'],['response','Create saved response']].map(([kind,label])=><button key={kind} disabled={busy} onClick={async()=>{setBusy(true);try{await inboxApi(`/ai/promote/${message._id}`,{method:'POST',body:{kind}});onClose();}catch(e){setError(e.message);}finally{setBusy(false);}}}>{label}</button>)}</details>}
 {error&&<p className={s.error} role="alert">{error}</p>}
 <div className={s.messageAttribution}>{message.authorName&&<b>{message.authorName}</b>}<span>{fullDate(message.occurredAt||message.createdAt)}</span><span>{message.direction==='outbound'?message.status:message.type==='note'?'Internal note':'Received'}</span></div>
 </div></Modal>;
}
