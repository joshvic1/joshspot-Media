import { useEffect, useRef, useState } from 'react';
import { FiSend, FiPaperclip, FiFileText, FiX, FiSmile, FiClock } from 'react-icons/fi';
import { inboxApi } from './api';
import NoteEditor from './NoteEditor';
import Templates from './Templates';
import Modal from './Modal';
import s from '../../styles/Inbox.module.css';
export default function Composer({ conversation, session, canReply, windowOpen, onSent }) {
  const [replyText, setReplyText] = useState(''); const [noteText, setNoteText] = useState(''); const [note, setNote] = useState(false); const [attachment, setAttachment] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [templates, setTemplates] = useState(false);
  const [mentions, setMentions] = useState([]);
  const noteEditor = useRef(null);
  const file = useRef(null); const pending = useRef(new Map()); const input = useRef(null);
  const text = note ? noteText : replyText; const setText = note ? setNoteText : setReplyText;
  useEffect(() => { if (input.current) { input.current.style.height = 'auto'; input.current.style.height = `${Math.min(170, Math.max(window.matchMedia('(max-width: 900px)').matches ? 30 : 32, input.current.scrollHeight))}px`; } }, [text, note]);
  const hasContent = Boolean(text.trim() || (!note && attachment));
  const connected = session.provider.configured;
  const disabled = !canReply || (!note && (!connected || !windowOpen));
  const send = async () => {
    if (busy || disabled || (!text.trim() && !attachment)) return;
    setBusy(true); setError('');
    const payload = { type: note ? 'note' : attachment?.type || 'text', text, ...(note ? { mentions } : {}), ...(attachment && !note ? { ticket: attachment.ticket } : {}) };
    // Retain the key after a network error. Retrying the same draft cannot send twice.
    const fingerprint = JSON.stringify(payload);
    if (!pending.current.has(fingerprint)) pending.current.set(fingerprint, crypto.randomUUID());
    try { await inboxApi(`/conversations/${conversation._id}/messages`, { method: 'POST', body: { ...payload, clientId: pending.current.get(fingerprint) } }); setText(''); if (note) setMentions([]); if (!note) setAttachment(null); pending.current.delete(fingerprint); await onSent(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const upload = async (event) => {
    const selected = event.target.files?.[0]; event.target.value = '';
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) { setError('Choose a PNG, JPEG or PDF smaller than 5 MB.'); return; }
    setBusy(true); setError('');
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(selected); });
      setAttachment(await inboxApi(`/conversations/${conversation._id}/media`, { method: 'POST', body: { data, name: selected.name } }));
    } catch (err) { setError(err.message || 'Could not read this file.'); } finally { setBusy(false); }
  };
  return <div className={s.composerArea}>
    {!canReply ? <div className={s.windowNotice}>Assign this conversation to yourself before replying.</div> : !connected && <div className={s.windowNotice}>WhatsApp is not connected. Internal notes are available.</div>}
    {error && <div className={s.error} role="alert">{error}</div>}
    <div className={`${s.composer} ${note ? s.noteComposer : ''}`}>
      {attachment && !note && <div className={s.attachmentChip}>{attachment.name}<button aria-label="Remove attachment" disabled={busy} onClick={() => setAttachment(null)}><FiX /></button></div>}
      <div hidden={!note}><NoteEditor ref={noteEditor} value={noteText} staff={session.staff} actorId={session.actor.id} disabled={disabled || busy} onChange={(value, ids) => { setNoteText(value); setMentions(ids); }} onSend={send} /></div>
      {!note && (!windowOpen && connected ? <div className={s.closedWindow}><FiClock /><div><b>Continue with a template</b><p>The 24-hour reply window has ended.</p></div><button disabled={!canReply} className={s.secondary} onClick={() => setTemplates(true)}>Choose template</button></div> : <textarea rows={1} ref={input} aria-label="Message" placeholder="Write a message…" value={replyText} disabled={disabled || busy} maxLength={attachment ? 1024 : 4096} onChange={event => setReplyText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />)}
      <footer><div><input type="file" ref={file} hidden accept="image/png,image/jpeg,application/pdf" onChange={upload} /><button className={s.iconButton} disabled={disabled || busy || note} title="Attach PNG, JPEG or PDF (up to 5 MB)" aria-label="Attach file" onClick={() => file.current?.click()}><FiPaperclip /></button><details data-popover className={s.emojiMenu}><summary aria-label="Insert emoji" title="Insert emoji"><FiSmile /></summary><div>{[['😊', 'Smile'], ['👍', 'Thumbs up'], ['🙏', 'Thanks'], ['✅', 'Check'], ['🎉', 'Celebrate'], ['❤️', 'Heart'], ['👋', 'Wave'], ['✨', 'Sparkles']].map(([emoji, label]) => <button key={label} title={label} aria-label={label} disabled={disabled || busy} onClick={(event) => { if (note) { noteEditor.current?.insertText(emoji); event.currentTarget.closest('details').open = false; return; } const position = input.current?.selectionStart ?? text.length; setText(text.slice(0, position) + emoji + text.slice(input.current?.selectionEnd ?? position)); event.currentTarget.closest('details').open = false; input.current?.focus(); }}>{emoji}</button>)}</div></details><button className={s.iconButton} title="Approved templates" aria-label="Choose template" disabled={!canReply || !connected || busy} onClick={() => setTemplates(true)}><FiFileText /></button></div><button className={`${s.send} ${note || !hasContent ? s.noteAction : ''}`} aria-label={hasContent ? note ? 'Send internal note' : 'Send message' : note ? 'Cancel internal note' : 'Write internal note'} disabled={busy || !canReply || (hasContent && disabled)} onClick={() => { if (hasContent) send(); else { setNote(!note); setError(''); } }}>{busy ? 'Sending…' : hasContent ? 'Send' : 'Note'}{hasContent ? <FiSend /> : note ? <FiX /> : <FiFileText />}</button></footer>
    </div>
    {templates && <Modal title="Send a template" onClose={() => setTemplates(false)}><Templates session={session} conversation={conversation} onSent={async () => { setTemplates(false); await onSent(); }} /></Modal>}
  </div>;
}


