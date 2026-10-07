import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FiEdit2} from 'react-icons/fi';
import styles from '../../styles/ReceiptDialog.module.css';
export default function EditInvoiceContact({record,demo,onSaved}){
 const dialog=useRef(null),[open,setOpen]=useState(false),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
 async function save(e){e.preventDefault();setBusy(true);setError('');try{
  if(!demo){const r=await fetch(`/api/admin/paid-invoices/${record.id}/contact`,{method:'PATCH',headers:{authorization:localStorage.getItem('adminToken')||'','Content-Type':'application/json'},body:JSON.stringify({email,phone})});const data=await r.json();if(!r.ok)throw Error(data.message);}
  setOpen(false);onSaved(demo?'Preview only: no details changed.':'Contact details saved. Use Send receipt or Resend course email to send to the corrected address.');
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 return <><button className={styles.send} onClick={()=>{setEmail(record.email||'');setPhone(record.phone||'');setError('');setOpen(true);}}><FiEdit2/> Edit invoice</button>
 {open&&createPortal(<dialog ref={dialog} className={styles.dialog} onCancel={e=>{if(busy)e.preventDefault();else setOpen(false);}} aria-labelledby={`edit-${record.id}`}><form onSubmit={save}>
 <h2 id={`edit-${record.id}`}>Edit invoice contact</h2><p>{record.name||'Customer'} · {record.service}</p><p>Correct the contact details. The paid amount, reference and payment status stay unchanged.</p>
 <label>Email<input type="email" maxLength={254} value={email} disabled={busy} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Phone number<input type="tel" maxLength={25} value={phone} disabled={busy} onChange={e=>setPhone(e.target.value)} placeholder="+234…"/></label>
 {error&&<p className={styles.error} role="alert">{error}</p>}<div className={styles.actions}><button type="button" disabled={busy} onClick={()=>setOpen(false)}>Cancel</button><button disabled={busy}>{busy?'Saving…':'Save details'}</button></div>
 </form></dialog>,document.body)}</>;
}
