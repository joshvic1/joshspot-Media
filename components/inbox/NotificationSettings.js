import {useEffect,useState} from 'react';
import {inboxApi} from './api';
import s from '../../styles/Inbox.module.css';
const defaults={assignments:false,messages:false,mentions:false,followups:false};
const options=[['assignments','Assigned to me','When a conversation is assigned to you.'],['messages','New messages','All new customer messages in chats you can access.'],['mentions','Staff mentions','When someone tags you in an internal note.'],['followups','Follow-up reminders','When a follow-up assigned to you is due.']];
const supported=()=>typeof window!=='undefined'&&window.isSecureContext&&'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window;
export async function disableInboxPush(){
 if(!supported())return;
 const registration=await navigator.serviceWorker.getRegistration('/crm-inbox');const subscription=await registration?.pushManager.getSubscription();
 if(subscription){await inboxApi('/push/subscription',{method:'DELETE',body:{endpoint:subscription.endpoint}});await subscription.unsubscribe()}
}
export default function NotificationSettings(){
 const [preferences,setPreferences]=useState(defaults),[permission,setPermission]=useState('default'),[subscription,setSubscription]=useState(null),[config,setConfig]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[available,setAvailable]=useState(false);
 useEffect(()=>{let active=true;const refreshPermission=()=>setPermission(supported()?Notification.permission:'unsupported');refreshPermission();setAvailable(supported());
 (async()=>{try{
  const cfg=await inboxApi('/push/config');if(!active)return;setConfig(cfg);
  if(supported()){
   const registration=await navigator.serviceWorker.getRegistration('/crm-inbox');const sub=await registration?.pushManager.getSubscription();
   if(sub){const result=await inboxApi('/push/preferences',{method:'POST',body:{endpoint:sub.endpoint}});if(active){setSubscription(sub);setPreferences({...defaults,...result.preferences})}}
  }
 }catch(e){if(active)setError(e.message)}finally{if(active)setBusy(false)}})();
 window.addEventListener('focus',refreshPermission);return()=>{active=false;window.removeEventListener('focus',refreshPermission)};
 },[]);
 const enable=async()=>{
  setBusy(true);setError('');try{
   const result=await Notification.requestPermission();setPermission(result);if(result!=='granted')return;
   const registration=await navigator.serviceWorker.register('/inbox-push-sw.js',{scope:'/crm-inbox'});
   await navigator.serviceWorker.ready;
   const bytes=Uint8Array.from(atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
   const sub=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
   await inboxApi('/push/subscription',{method:'PUT',body:{subscription:sub.toJSON(),preferences:defaults}});setSubscription(sub);setPreferences(defaults);
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const toggle=async(key)=>{setBusy(true);setError('');const next={...preferences,[key]:!preferences[key]};try{await inboxApi('/push/subscription',{method:'PUT',body:{subscription:subscription.toJSON(),preferences:next}});setPreferences(next)}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className={s.notificationSettings}><h2>Notifications</h2><p>Off by default. Choose which alerts this browser sends to your device. Message content and phone numbers stay out of notification previews.</p>
 {error&&<p role="alert" className={s.error}>{error}</p>}
 {!available?<p>Push notifications are unavailable in this browser. On iPhone or iPad, add the site to your Home Screen and open it there.</p>:permission==='denied'?<p>Notifications are blocked. Allow them in your browser or device settings, then return here.</p>:!config?.configured&&!busy?<p>Device notifications are awaiting administrator setup.</p>:<button type="button" className={s.pushPermission} disabled={busy||!config?.configured} onClick={subscription&&permission==='granted'?async()=>{setBusy(true);try{await disableInboxPush();setSubscription(null);setPreferences(defaults)}catch(e){setError(e.message)}finally{setBusy(false)}}:enable}>{busy?'Please wait…':subscription&&permission==='granted'?'Turn off device notifications':'Enable device notifications'}</button>}
 <div>{options.map(([key,label,description])=><label key={key} className={s.notificationOption}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" role="switch" aria-label={label} checked={preferences[key]} disabled={busy||permission!=='granted'||!subscription||!config?.configured} onChange={()=>toggle(key)}/></label>)}</div>
 <p>Settings apply to this browser and account. Your Alerts tab remains available even with device notifications off.</p></div>;
}
