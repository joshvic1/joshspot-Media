import {useEffect,useState} from 'react';
import {inboxApi} from './api';
import s from '../../styles/Availability.module.css';
export default function Availability(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true;const load=()=>inboxApi('/availability').then(d=>{if(alive)setData(d)}).catch(e=>{if(alive)setError(e.message)});load();const timer=setInterval(()=>{if(!document.hidden)load()},15000);return()=>{alive=false;clearInterval(timer)}},[]);
 async function toggle(){setBusy(true);setError('');try{setData(await inboxApi('/availability',{method:'PUT',body:{offline:!data.offline,revision:data.revision,day:data.day}}));window.dispatchEvent(new Event('inbox-update'));}catch(e){setError(e.message);try{setData(await inboxApi('/availability'))}catch{}}finally{setBusy(false)}}
 const disabled=busy||!data?.enabled||!data?.working;
 return <div className={s.availability}>
 <button type="button" role="switch" aria-label="Staff online status" aria-checked={Boolean(data&&!data.offline)} disabled={disabled} onClick={toggle} className={!data?.working?s.offHours:data.offline?s.offline:s.online} title={!data?.enabled?'Activate earnings tracking to enable availability':!data.working?'Outside working hours':data.offline?'Return online':'Take an offline break'}>
 <span className={s.statusText}><b>{busy?'Updating…':!data?'Loading…':!data.working?'Off hours':data.offline?'Offline':'Online'}</b>{data?.working&&<small>{(data.remainingMs>0?`${Math.ceil(data.remainingMs/60000)}m break left`:`${Math.floor(data.offlineMs/60000)-60}m over allowance`)}</small>}</span><span className={s.track} aria-hidden="true"><i/></span>
 </button>{error&&<p role="alert">{error}</p>}
 </div>;
}
