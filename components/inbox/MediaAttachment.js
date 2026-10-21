import MediaViewer from './MediaViewer';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiDownload, FiPlay, FiPause, FiFile } from 'react-icons/fi';
import { inboxApi } from './api';
import s from '../../styles/Inbox.module.css';
const playbackSpeeds = [1, 1.5, 2, 2.5, 3];
const time = value => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '0:00';
export default function MediaAttachment({ conversationId, message }) {
  const [url, setUrl] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [preview, setPreview] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [playing, setPlaying] = useState(false); const [position, setPosition] = useState(0); const [duration, setDuration] = useState(0);
  const watchdog = useRef(null); const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>()=>clearTimeout(watchdog.current),[]);
  const root = useRef(null); const audio = useRef(null); const pending = useRef(false); const compatible = useRef(false);
  useEffect(() => { if (audio.current) audio.current.playbackRate = speed; }, [speed, url]);
  const base = `/conversations/${conversationId}/messages/${message._id}`;
  const load = useCallback(async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setMediaReady(false);
    try {
      if (message.type === 'audio' && (compatible.current || /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1) || !audio.current?.canPlayType('audio/ogg; codecs="opus"'))) {
        compatible.current = true;
        let result;
        for(let attempt=0;attempt<3;attempt++){
          try{result=await inboxApi(`${base}/audio-ticket`,{method:'POST',body:{}});break;}
          catch(err){if(err.status!==503||attempt===2)throw err;await new Promise(resolve=>setTimeout(resolve,1500*(attempt+1)));if(!mounted.current)return;}
        }
        if(mounted.current)setUrl(result.url);
        return;
      }
      const result = await inboxApi(`${base}/media-link`); setUrl(result.source === 'meta' ? URL.createObjectURL(await inboxApi(`${base}/media`, { blob: true, backendUrl: result.backendUrl })) : result.url); }
    catch (err) { setError(err.message); }
    finally { pending.current = false; setBusy(false); }
  }, [base, message.type]);
  useEffect(() => () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    // Prepare audio only on a deliberate tap; scrolling must not start many conversions.
    if(message.type==='audio')return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); } }, { rootMargin: '100px' });
    observer.observe(root.current); return () => { observer.disconnect(); };
  }, [load, base, message.type]);
  const download = async () => {
    try { const result = await inboxApi(`${base}/media-link?download=1`); const link = document.createElement('a'); link.href = result.source === 'meta' ? URL.createObjectURL(await inboxApi(`${base}/media`, { blob: true, backendUrl: result.backendUrl })) : result.url; link.download = message.media?.name || `attachment-${message._id}`; link.rel = 'noopener'; link.click(); if (link.href.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(link.href), 10000); }
    catch (err) { setError(err.message); }
  };
  const toggle = async () => {
    if (!url) { await load(); return; }
    try { if (audio.current.paused) {
      const start=audio.current.currentTime;
      clearTimeout(watchdog.current);
      watchdog.current=setTimeout(()=>{if(audio.current&&audio.current.currentTime===start){audio.current.pause();if(!compatible.current){compatible.current=true;load();}else setError('Audio did not start. Tap Retry to reload it.');}},10000);
      await audio.current.play();
    } else {clearTimeout(watchdog.current);audio.current.pause();} }
    catch { clearTimeout(watchdog.current);if(!compatible.current){compatible.current=true;await load();}else setError('Cannot play this audio. Please retry.'); }
  };
  // Safari may wait for a user gesture before firing canplay.
  const audioLoading = !error && busy;
  useEffect(()=>{if(message.type==='audio'&&url&&audio.current){setPosition(0);setDuration(0);setPlaying(false);audio.current.load();}},[url,message.type]);
  const failed = () => { if(message.type === 'audio' && !compatible.current && !pending.current){compatible.current=true;load();return;} setPlaying(false); setError('Media unavailable. Retry to refresh the link, or download the file.'); };
  return <div ref={root} className={`${s.chatMedia} ${message.type === 'audio' ? s.voiceMedia : ''}`}>
    {message.type === 'audio' ? <div className={s.voicePlayer}>
      <button aria-label={audioLoading ? 'Loading audio' : !url ? 'Load audio' : playing ? 'Pause audio' : 'Play audio'} aria-busy={audioLoading} onClick={toggle} disabled={audioLoading || Boolean(error)} className={s.voicePlay}>{audioLoading ? <span className={`${s.mediaSpinner} ${s.audioSpinner}`} aria-hidden="true" /> : playing ? <FiPause /> : <FiPlay />}</button>
      <div className={s.voiceTrack}><input aria-label="Audio progress" type="range" min="0" max={Number.isFinite(duration) && duration > 0 ? duration : 1} step="0.1" value={position} disabled={!duration} onChange={event => { audio.current.currentTime = Number(event.target.value); setPosition(Number(event.target.value)); }} /><small>{!url?(busy?'Preparing audio…':'Tap to load audio'):`${time(position)} / ${time(duration)}`}</small></div>
      <audio playsInline ref={audio} src={url || undefined} preload="metadata" onLoadStart={() => setMediaReady(false)} onCanPlay={() => setMediaReady(true)} onWaiting={() => setMediaReady(false)} onPlaying={() => {setMediaReady(true);setPlaying(true);}} onLoadedMetadata={event => { setDuration(event.currentTarget.duration); event.currentTarget.playbackRate = speed; }} onTimeUpdate={event => { if(event.currentTarget.currentTime>0)clearTimeout(watchdog.current);setPosition(event.currentTarget.currentTime); }}  onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={failed} />
      <button type="button" className={s.voiceSpeed} aria-label={`Playback speed ${speed}x. Change speed`} title="Change playback speed" onClick={() => setSpeed(current => playbackSpeeds[(playbackSpeeds.indexOf(current) + 1) % playbackSpeeds.length])}>{speed}×</button>
    </div> : ['video', 'image', 'sticker'].includes(message.type) ? <div className={s.mediaStage} aria-busy={!error && (busy || !url || !mediaReady)}>
      {url && (message.type === 'video' ? <video controls playsInline preload="auto" src={url} onLoadedData={() => setMediaReady(true)} onCanPlay={() => setMediaReady(true)} onWaiting={() => setMediaReady(false)} onPlaying={() => setMediaReady(true)} onError={failed} /> : <button className={s.imagePreviewButton} onClick={() => setPreview(true)} aria-label="View full image"><Image src={url} width={320} height={240} unoptimized alt={message.media?.name || 'Chat image'} onLoad={() => setMediaReady(true)} onError={failed} /></button>)}
      {url && message.type === 'video' && <button className={s.videoPreviewButton} onClick={() => { root.current.querySelector('video')?.pause(); setPreview(true); }}>Expand video</button>}
      {!error && (busy || !url || !mediaReady) && <div className={s.mediaLoadingOverlay} role="status" aria-label={message.type === 'video' ? 'Loading video' : 'Loading image'}><span className={s.mediaSpinner} aria-hidden="true" /></div>}
    </div> : <button className={s.attachment} onClick={download}><FiFile />{message.media?.name || 'Download document'}<FiDownload /></button>}

    {preview && <MediaViewer url={url} type={message.type} name={message.media?.name} onClose={() => setPreview(false)} />}
    {error && <div className={s.mediaFailure}><span>{error}</span><button onClick={load} disabled={busy}>Retry</button>{message.type !== 'audio' && <button onClick={download}>Download</button>}</div>}
  </div>;
}
