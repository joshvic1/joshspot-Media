import { useEffect, useRef, useState } from 'react';
import { FiMic, FiSquare, FiTrash2, FiSend } from 'react-icons/fi';
import Modal from './Modal';
import { inboxApi } from './api';
import s from '../../styles/Inbox.module.css';
export default function VoiceRecorder({ conversationId, replyTo, onClose, onSent }) {
 const [stage,setStage]=useState('ready'),[seconds,setSeconds]=useState(0),[url,setUrl]=useState(''),[error,setError]=useState('');
 const recorder=useRef(null),stream=useRef(null),blob=useRef(null),preview=useRef(''),alive=useRef(true),timer=useRef(null),ticket=useRef(null),clientId=useRef(null);
 const release=()=>{clearInterval(timer.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(recorder.current?.state==='recording')recorder.current.stop();release();if(preview.current)URL.revokeObjectURL(preview.current);};},[]);
 const stop=()=>{if(recorder.current?.state==='recording')recorder.current.stop();release();};
 const start=async()=>{
  setError('');setStage('permission');
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('Recording is not supported here. Use a current browser over HTTPS.');
   const mic=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!alive.current){mic.getTracks().forEach(t=>t.stop());return;}stream.current=mic;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
   const r=new MediaRecorder(mic,mime?{mimeType:mime,audioBitsPerSecond:64000}:undefined);recorder.current=r;const chunks=[];let bytes=0;
   r.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);bytes+=e.data.size;if(bytes>=4*1024*1024)stop();}};
   r.onerror=()=>{stop();if(alive.current){setError('Recording failed. Please try again.');setStage('ready');}};
   r.onstop=()=>{release();if(!alive.current)return;blob.current=new Blob(chunks,{type:r.mimeType});if(!blob.current.size){setError('No audio captured. Please try again.');setStage('ready');return;}if(preview.current)URL.revokeObjectURL(preview.current);preview.current=URL.createObjectURL(blob.current);setUrl(preview.current);ticket.current=null;clientId.current=crypto.randomUUID();setStage('preview');};
   setSeconds(0);r.start(250);setStage('recording');const began=Date.now();timer.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-began)/1000);setSeconds(elapsed);if(elapsed>=180)stop();},250);
  }catch(e){release();if(alive.current){setStage('ready');setError(e.name==='NotAllowedError'?'Allow microphone access in your browser to record a voice note.':e.message||'Could not access the microphone.');}}
 };
 const send=async()=>{
  setStage('sending');setError('');
  try{
   if(!ticket.current){const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Could not read recording.'));reader.readAsDataURL(blob.current);});ticket.current=await inboxApi(`/conversations/${conversationId}/media`,{method:'POST',body:{data,name:'voice-note',recording:true}});}
   await inboxApi(`/conversations/${conversationId}/messages`,{method:'POST',body:{type:'audio',text:'',ticket:ticket.current.ticket,clientId:clientId.current,...(replyTo?{replyTo:replyTo._id}:{})}});
   onClose();onSent();
  }catch(e){if(alive.current){setError(e.message);setStage('preview');}}
 };
 return <Modal title="Voice note" onClose={()=>{if(stage!=='sending')onClose();}}><div className={s.voiceRecorder}>
  <div className={`${s.voiceOrb} ${stage==='recording'?s.voiceActive:''}`}><FiMic /></div>
  <strong>{stage==='recording'?'Recording…':stage==='preview'?'Ready to send':stage==='sending'?'Sending voice note…':stage==='permission'?'Allow microphone access':'Record a voice note'}</strong>
  <span className={s.voiceTimer}>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</span>
  {stage==='recording'&&<div className={s.voiceBars} aria-hidden="true">{Array.from({length:15},(_,i)=><i key={i} style={{animationDelay:`${i*70}ms`}} />)}</div>}
  {url&&['preview','sending'].includes(stage)&&<audio controls src={url} className={s.voicePreview}/>}
  {error&&<p className={s.error} role="alert">{error}</p>}
  <div className={s.voiceControls}>
   {stage==='ready'&&<button className={s.primary} onClick={start}><FiMic/>Start recording</button>}
   {stage==='recording'&&<button className={s.primary} onClick={stop}><FiSquare/>Stop recording</button>}
   {stage==='preview'&&<><button className={s.secondary} onClick={()=>{URL.revokeObjectURL(preview.current);preview.current='';blob.current=null;setUrl('');setSeconds(0);setStage('ready');}}><FiTrash2/>Discard</button><button className={s.primary} onClick={send}><FiSend/>Send</button></>}
   {stage==='sending'&&<span className={s.sendSpinner} role="status" aria-label="Sending voice note"/>}
  </div><small>Up to 3 minutes · Preview before sending</small>
 </div></Modal>;
}
