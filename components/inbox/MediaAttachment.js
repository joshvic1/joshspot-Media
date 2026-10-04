import MediaViewer from './MediaViewer';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiDownload, FiPlay, FiPause, FiFile } from 'react-icons/fi';
import { inboxApi } from './api';
import s from '../../styles/Inbox.module.css';
const time = value => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '0:00';
export default function MediaAttachment({ conversationId, message }) {
  const [url, setUrl] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [playing, setPlaying] = useState(false); const [position, setPosition] = useState(0); const [duration, setDuration] = useState(0);
  const root = useRef(null); const audio = useRef(null); const pending = useRef(false);
  const base = `/conversations/${conversationId}/messages/${message._id}`;
  const load = useCallback(async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setMediaReady(false);
    try { const result = await inboxApi(`${base}/media-link`); setUrl(result.source === 'meta' ? URL.createObjectURL(await inboxApi(`${base}/media`, { blob: true, backendUrl: result.backendUrl })) : result.url); }
    catch (err) { setError(err.message); }
    finally { pending.current = false; setBusy(false); }
  }, [base]);
  useEffect(() => () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); } }, { rootMargin: '100px' });
    observer.observe(root.current); return () => { observer.disconnect(); };
  }, [load, base]);
  const download = async () => {
    try { const result = await inboxApi(`${base}/media-link?download=1`); const link = document.createElement('a'); link.href = result.source === 'meta' ? URL.createObjectURL(await inboxApi(`${base}/media`, { blob: true, backendUrl: result.backendUrl })) : result.url; link.download = message.media?.name || `attachment-${message._id}`; link.rel = 'noopener'; link.click(); if (link.href.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(link.href), 10000); }
    catch (err) { setError(err.message); }
  };
  const toggle = async () => {
    if (!url) { await load(); return; }
    try { if (audio.current.paused) await audio.current.play(); else audio.current.pause(); }
    catch { setError('Cannot play this audio. Retry or download it.'); }
  };
  const audioLoading = !error && (busy || !url || !mediaReady);
  const failed = () => { setPlaying(false); setError('Media unavailable. Retry to refresh the link, or download the file.'); };
  return <div ref={root} className={`${s.chatMedia} ${message.type === 'audio' ? s.voiceMedia : ''}`}>
    {message.type === 'audio' ? <div className={s.voicePlayer}>
      <button aria-label={audioLoading ? 'Loading audio' : playing ? 'Pause audio' : 'Play audio'} aria-busy={audioLoading} onClick={toggle} disabled={audioLoading || Boolean(error)} className={s.voicePlay}>{audioLoading ? <span className={`${s.mediaSpinner} ${s.audioSpinner}`} aria-hidden="true" /> : playing ? <FiPause /> : <FiPlay />}</button>
      <div className={s.voiceTrack}><input aria-label="Audio progress" type="range" min="0" max={Number.isFinite(duration) && duration > 0 ? duration : 1} step="0.1" value={position} disabled={!duration} onChange={event => { audio.current.currentTime = Number(event.target.value); setPosition(Number(event.target.value)); }} /><small>{`${time(position)} / ${time(duration)}`}</small></div>
      <audio ref={audio} src={url || undefined} preload="auto" onLoadStart={() => setMediaReady(false)} onCanPlay={() => setMediaReady(true)} onWaiting={() => setMediaReady(false)} onPlaying={() => setMediaReady(true)} onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => setPosition(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={failed} />
      <button className={s.mediaDownload} aria-label="Download audio" onClick={download}><FiDownload /></button>
    </div> : ['video', 'image', 'sticker'].includes(message.type) ? <div className={s.mediaStage} aria-busy={!error && (busy || !url || !mediaReady)}>
      {url && (message.type === 'video' ? <video controls playsInline preload="auto" src={url} onLoadedData={() => setMediaReady(true)} onCanPlay={() => setMediaReady(true)} onWaiting={() => setMediaReady(false)} onPlaying={() => setMediaReady(true)} onError={failed} /> : <button className={s.imagePreviewButton} onClick={() => setPreview(true)} aria-label="View full image"><Image src={url} width={320} height={240} unoptimized alt={message.media?.name || 'Chat image'} onLoad={() => setMediaReady(true)} onError={failed} /></button>)}
      {url && message.type === 'video' && <button className={s.videoPreviewButton} onClick={() => { root.current.querySelector('video')?.pause(); setPreview(true); }}>Expand video</button>}
      {!error && (busy || !url || !mediaReady) && <div className={s.mediaLoadingOverlay} role="status" aria-label={message.type === 'video' ? 'Loading video' : 'Loading image'}><span className={s.mediaSpinner} aria-hidden="true" /></div>}
    </div> : <button className={s.attachment} onClick={download}><FiFile />{message.media?.name || 'Download document'}<FiDownload /></button>}

    {preview && <MediaViewer url={url} type={message.type} name={message.media?.name} onClose={() => setPreview(false)} />}
    {error && <div className={s.mediaFailure}><span>{error}</span><button onClick={load} disabled={busy}>Retry</button>{message.type !== 'audio' && <button onClick={download}>Download</button>}</div>}
  </div>;
}
