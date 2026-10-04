import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { FiX } from 'react-icons/fi';
import s from '../../styles/Inbox.module.css';
export default function MediaViewer({ url, type, name, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { const before = document.activeElement; const el = dialog.current; el.showModal(); return () => { el.close(); before?.focus(); }; }, []);
  return <dialog ref={dialog} className={s.mediaViewer} aria-label="Media preview" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}><header><span>{name || (type === 'video' ? 'Video' : 'Image')}</span><button aria-label="Close media preview" onClick={onClose}><FiX /></button></header><div>{type === 'video' ? <video src={url} controls playsInline preload="metadata" /> : <Image src={url} alt={name || 'Chat image'} width={1200} height={900} unoptimized />}</div></dialog>;
}
