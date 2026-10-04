import {useEffect,useState} from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {inboxApi} from '../../components/inbox/api';
import {RowsSkeleton} from '../../components/inbox/Skeleton';
import s from '../../styles/AIAgent.module.css';
export default function KnowledgePage(){
 const [saved,setSaved]=useState(null),[text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const dirty=saved && text!==saved.text;
 async function load(){setError('');try{const r=await inboxApi('/ai/master-knowledge');setSaved(r);setText(r.text);}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[]);
 useEffect(()=>{if(!dirty)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 async function save(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{const r=await inboxApi('/ai/master-knowledge',{method:'PUT',body:{text,revision:saved.revision}});setSaved(r);setNotice('Legacy reference saved. Structured knowledge is unchanged.');}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <AdminLayout active="ai-knowledge"><div className={s.agent}>
 <form className={s.editor} onSubmit={save}><h2>Legacy knowledge reference</h2><p>Preserved for reference and migration. The structured sales engine does not read this document. Move approved information into Knowledge Base entries in AI Agent. The legacy engine still uses it until structured sales is enabled.</p>
 {error&&<p className={s.error} role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {!saved?<><RowsSkeleton/><button type="button" onClick={load}>Retry loading</button></>:<>
 <label htmlFor="master-knowledge">Instructions and business knowledge</label>
 <textarea id="master-knowledge" className={s.masterKnowledge} value={text} maxLength={saved.maxLength} onChange={e=>{setText(e.target.value);setNotice('');}} spellCheck={false} placeholder="Paste your complete instructions, FAQs, examples and sales guidance here…"/>
 <div className={s.knowledgeFooter}><small>{text.length.toLocaleString()} / {saved.maxLength.toLocaleString()} characters · {text.split('\n').length.toLocaleString()} lines · {dirty?'Unsaved changes':'Saved version'}</small><div><button type="button" disabled={busy} onClick={()=>{if(!dirty||window.confirm('Discard your unsaved draft and reload?'))load();}}>Reload saved version</button><button type="submit" disabled={busy||!dirty}>{busy?'Saving…':'Save knowledge'}</button></div></div>
 <p><small>This archive does not control the structured sales engine. Keep passwords and access tokens out of this document.</small></p></>}
 </form></div></AdminLayout>;
}
