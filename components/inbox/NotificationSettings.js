import {useEffect,useState} from 'react';
import {FiChevronDown} from 'react-icons/fi';
import {inboxApi} from './api';
import s from '../../styles/Inbox.module.css';
const defaults={assignments:false,messages:false,mentions:true,staff_messages:true,followups:false,previews:true};
const options=[['staff_messages','Staff messages','Notify me when a teammate sends me a private message.'],['previews','Show contact names','Show the chat name in mention notifications on your lock screen.'],['mentions','Staff mentions','Notify me only when someone tags me in an internal note.']];
const supported=()=>typeof window!=='undefined'&&window.isSecureContext&&'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window;
export async function disableInboxPush(){
 if(!supported())return;
 const registration=await navigator.serviceWorker.getRegistration('/crm-inbox');const subscription=await registration?.pushManager.getSubscription();
 if(subscription){await inboxApi('/push/subscription',{method:'DELETE',body:{endpoint:subscription.endpoint}});await subscription.unsubscribe()}
}
export default function NotificationSettings({actorId}){
 const [expanded,setExpanded]=useState(false);
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
 const enable=async(key)=>{
  setBusy(true);setError('');try{
   const result=await Notification.requestPermission();setPermission(result);if(result!=='granted')return;
   const registration=await navigator.serviceWorker.register('/inbox-push-sw.js',{scope:'/crm-inbox'});
   await navigator.serviceWorker.ready;
   const bytes=Uint8Array.from(atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
   const sub=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
   await inboxApi('/push/subscription',{method:'PUT',body:{subscription:sub.toJSON(),preferences:{...preferences,...(typeof key==='string'?{[key]:true}:{})}}});localStorage.removeItem(`inbox-push-off:${actorId}`);setSubscription(sub);setPreferences({...preferences,...(typeof key==='string'?{[key]:true}:{})});
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const toggle=async(key)=>{if(!subscription||permission!=='granted'){if(key==='previews'){setPreferences({...preferences,previews:!preferences.previews});return;}return enable(key);}setBusy(true);setError('');const next={...preferences,[key]:!preferences[key]};try{await inboxApi('/push/subscription',{method:'PUT',body:{subscription:subscription.toJSON(),preferences:next}});setPreferences(next)}catch(e){setError(e.message)}finally{setBusy(false)}};
 const turnOff=async()=>{setBusy(true);try{await disableInboxPush();localStorage.setItem(`inbox-push-off:${actorId}`,'1');setSubscription(null)}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <div className={s.notificationSettings}>
 <div className={s.notificationHeading}><button type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><strong>Notifications</strong><FiChevronDown style={{transform:expanded?'rotate(180deg)':undefined}}/></button><input type="checkbox" role="switch" aria-label="Device notifications" checked={Boolean(subscription&&permission==='granted')} disabled={busy||!available||permission==='denied'||!config?.configured} onChange={()=>subscription&&permission==='granted'?turnOff():enable()}/></div>
 {error&&<p role="alert" className={s.error}>{error}</p>}
 {expanded&&<div><p>Staff messages and tags in internal notes send notifications. Assignments, new messages and follow-up reminders do not send alerts.</p>
 {!available?<p>On iPhone or iPad, add this site to your Home Screen and open it there to enable notifications.</p>:permission==='denied'?<p>Notifications are blocked. Allow them in your browser or device settings.</p>:!config?.configured&&!busy?<p>Device notifications are not configured yet. Contact your administrator.</p>:null}
 <div>{options.map(([key,label,description])=><label key={key} className={s.notificationOption}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" role="switch" aria-label={label} checked={preferences[key]} disabled={busy||!available||permission==='denied'||!config?.configured} onChange={()=>toggle(key)}/></label>)}</div>
 <p>Preferences apply to this browser and account. Alerts in the inbox remain available when device notifications are off.</p></div>}</div>;
}

export function NotificationPermissionPrompt({actorId,onSettings}){
 const [show,setShow]=useState(false),[cfg,setCfg]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{try{
  if(!supported()||Notification.permission==='denied'||localStorage.getItem(`inbox-push-off:${actorId}`)||sessionStorage.getItem(`inbox-push-later:${actorId}`))return;
  const config=await inboxApi('/push/config');if(!active||!config.configured)return;
  const registration=await navigator.serviceWorker.getRegistration('/crm-inbox');const sub=await registration?.pushManager.getSubscription();
  if(active&&!sub){setCfg(config);setShow(true)}
 }catch{} })();return()=>{active=false}},[actorId]);
 const enable=async()=>{setBusy(true);setError('');try{
  if(await Notification.requestPermission()!=='granted'){setShow(false);return;}
  const registration=await navigator.serviceWorker.register('/inbox-push-sw.js',{scope:'/crm-inbox'});await navigator.serviceWorker.ready;
  const bytes=Uint8Array.from(atob(cfg.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
  await inboxApi('/push/subscription',{method:'PUT',body:{subscription:subscription.toJSON(),preferences:defaults}});setShow(false);onSettings();
 }catch(e){setError(e.message)}finally{setBusy(false)}};
 if(!show)return null;
 return <div className={s.pushPrompt} role="dialog" aria-label="Enable inbox notifications"><strong>Stay on top of your chats</strong><p>Allow Joshspot Inbox to notify you when a teammate messages you or tags you in an internal note on this device.</p>{error&&<p role="alert">{error}</p>}<div><button disabled={busy} onClick={enable}>{busy?'Enabling…':'Enable notifications'}</button><button disabled={busy} onClick={()=>{sessionStorage.setItem(`inbox-push-later:${actorId}`,'1');setShow(false)}}>Not now</button></div></div>;
}
