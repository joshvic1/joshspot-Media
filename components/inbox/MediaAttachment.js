import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FiDownload, FiImage } from 'react-icons/fi';
import { inboxApi } from './api';
import s from '../../styles/Inbox.module.css';
export default function MediaAttachment({ conversationId, message, onError }) {
  const [url, setUrl] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const fetchMedia = async (preview) => {
    setBusy(true);
    try {
      const blob = await inboxApi(`/conversations/${conversationId}/messages/${message._id}/media`, { blob: true });
      if (preview && !['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) throw new Error('Image preview is unavailable. Download the attachment instead.');
      const objectUrl = URL.createObjectURL(blob);
      if (preview) setUrl(objectUrl);
      else { const link = document.createElement('a'); link.href = objectUrl; link.download = message.media.name || `attachment-${message._id}`; link.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 10000); }
    } catch (err) { onError(err.message); } finally { setBusy(false); }
  };
  return <div>{url && <div className={s.imagePreview}><Image src={url} alt={message.text || 'Customer attachment'} fill unoptimized sizes="300px" style={{ objectFit: 'contain' }} /></div>}{['image', 'sticker'].includes(message.type) && !url && <button disabled={busy} className={s.attachment} onClick={() => fetchMedia(true)}><FiImage />{busy ? 'Loading…' : 'Preview image'}</button>}<button disabled={busy} className={s.attachment} onClick={() => fetchMedia(false)}><FiDownload />{message.media.name || `${message.type} attachment`}</button></div>;
}
