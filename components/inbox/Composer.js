import { useEffect, useRef, useState } from 'react';
import { FiSend, FiPaperclip, FiFileText, FiX, FiSmile, FiClock } from 'react-icons/fi';
import { inboxApi } from './api';
import NoteEditor from './NoteEditor';
import { HiOutlineSparkles } from 'react-icons/hi';
import ChatActions from './ChatActions';
import a from '../../styles/InboxActions.module.css';
import Templates from './Templates';
import Modal from './Modal';
import s from '../../styles/Inbox.module.css';
export default function Composer({ conversation, session, canReply, windowOpen, onSent, replyTo, onCancelReply }) {
  const [replyText, setReplyText] = useState(''); const [noteText, setNoteText] = useState(''); const [note, setNote] = useState(false); const [attachment, setAttachment] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [templates, setTemplates] = useState(false);
  const toolMenu = useRef(null); const [emojiOpen, setEmojiOpen] = useState(false);
  const closeTools = () => { if (toolMenu.current) toolMenu.current.open = false; setEmojiOpen(false); };
  const [mentions, setMentions] = useState([]);
  const [actions, setActions] = useState(false); const [quick, setQuick] = useState([]); const [slash, setSlash] = useState(null); const [quickIndex, setQuickIndex] = useState(0);
  useEffect(() => { let active = true; const load = () => inboxApi('/quick-replies').then(data => { if (active) setQuick(data.items || []); }).catch(() => {}); load(); window.addEventListener('focus', load); return () => { active = false; window.removeEventListener('focus', load); }; }, []);
  const quickMatches = quick.filter(item => item.keyword.includes(slash?.query || '')).slice(0, 12);
  const detectSlash = element => { const prefix = element.value.slice(0, element.selectionStart); const match = /(?:^|\s)\/([a-zA-Z0-9_-]*)$/.exec(prefix); setSlash(match ? { query: match[1].toLowerCase(), start: prefix.lastIndexOf('/'), end: element.selectionStart } : null); setQuickIndex(0); };
  const insertQuick = item => { if (!slash) return; const value = replyText.slice(0, slash.start) + item.response + replyText.slice(slash.end); if (value.length > (attachment ? 1024 : 4096)) { setError('This reply exceeds the message length. Shorten your draft first.'); return; } setReplyText(value); setSlash(null); pauseForTyping(); requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(slash.start + item.response.length, slash.start + item.response.length); }); };

  const typingPaused = useRef(false);
  const pauseForTyping = () => {
    if (typingPaused.current || conversation.ai?.active === false) return;
    typingPaused.current = true;
    inboxApi(`/ai/conversations/${conversation._id}/typing`, { method: 'POST', body: {} }).catch(() => { typingPaused.current = false; });
  };
  useEffect(() => { typingPaused.current = false; }, [conversation._id, conversation.ai?.version]);
  const noteEditor = useRef(null);
  const file = useRef(null); const pending = useRef(new Map()); const input = useRef(null);
  const text = note ? noteText : replyText; const setText = note ? setNoteText : setReplyText;
  useEffect(() => { if (input.current) { input.current.style.height = 'auto'; input.current.style.height = `${Math.min(170, Math.max(window.matchMedia('(max-width: 900px)').matches ? 30 : 32, input.current.scrollHeight))}px`; } }, [text, note]);
  useEffect(() => { if (replyTo) { setNote(false); input.current?.focus(); } }, [replyTo]);
  const hasContent = Boolean(text.trim() || (!note && attachment));
  const connected = session.provider.configured;
  const disabled = !canReply || (!note && (!connected || !windowOpen));
  const send = async () => {
    if (busy || disabled || !hasContent) return;
    setBusy(true); setError('');
    const payload = { type: note ? 'note' : attachment?.type || 'text', text, ...(note ? { mentions } : replyTo ? { replyTo: replyTo._id } : {}), ...(attachment && !note ? { ticket: attachment.ticket } : {}) };
    // Retain the key after a network error. Retrying the same draft cannot send twice.
    const fingerprint = JSON.stringify(payload);
    if (!pending.current.has(fingerprint)) pending.current.set(fingerprint, crypto.randomUUID());
    try { await inboxApi(`/conversations/${conversation._id}/messages`, { method: 'POST', body: { ...payload, clientId: pending.current.get(fingerprint) } }); setText(''); if (note) setMentions([]); if (!note) { setAttachment(null); onCancelReply?.(); } pending.current.delete(fingerprint); await onSent(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const upload = async (event) => {
    const selected = event.target.files?.[0]; event.target.value = '';
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) { setError('Choose a PNG, JPEG, PDF, MP4, MP3 or OGG smaller than 5 MB.'); return; }
    setBusy(true); setError('');
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(selected); });
      setAttachment(await inboxApi(`/conversations/${conversation._id}/media`, { method: 'POST', body: { data, name: selected.name } }));
    } catch (err) { setError(err.message || 'Could not read this file.'); } finally { setBusy(false); }
  };
  return <div className={s.composerArea} style={{ position: 'relative' }}>
    {!canReply ? <div className={s.windowNotice}>Assign this conversation to yourself before replying.</div> : !connected && <div className={s.windowNotice}>WhatsApp is not connected. Internal notes are available.</div>}
    {error && <div className={s.error} role="alert">{error}</div>}
    {!note && slash && !disabled && <div className={a.quick} role="listbox" aria-label="Quick replies">{quickMatches.length ? quickMatches.map((item, index) => <button type="button" role="option" aria-selected={index === quickIndex} key={item._id} onMouseDown={e => e.preventDefault()} onClick={() => insertQuick(item)}><b>/{item.keyword}</b><span>{item.response}</span></button>) : <p>No matching quick replies.</p>}</div>}
    <div className={`${s.composer} ${note ? s.noteComposer : ''}`}>
      {replyTo && !note && <div className={s.replyDraft}><div><b>Replying to {replyTo.authorName || conversation.contact.name || 'Customer'}</b><span>{replyTo.text || `[${replyTo.type}]`}</span></div><button type="button" className={s.iconButton} aria-label="Cancel reply" onClick={onCancelReply}><FiX /></button></div>}
      {attachment && !note && <div className={s.attachmentChip}>{attachment.name}<button aria-label="Remove attachment" disabled={busy} onClick={() => setAttachment(null)}><FiX /></button></div>}
      <div className={s.composerLine}>
      <details ref={toolMenu} data-popover className={s.composerTools} onToggle={event => { if (!event.currentTarget.open) setEmojiOpen(false); }}><summary aria-label="Message tools" title="Message tools"><FiPaperclip /></summary><div className={s.composerToolPanel}>
        <div className={s.composerToolGrid}>
          <button type="button" disabled={disabled || busy || note} onClick={() => { closeTools(); file.current?.click(); }} aria-label="Attach file"><FiPaperclip /><span>Media</span></button>
          <button type="button" disabled={disabled || busy} onClick={() => setEmojiOpen(!emojiOpen)} aria-label="Insert emoji" aria-expanded={emojiOpen}><FiSmile /><span>Emoji</span></button>
          <button type="button" disabled={!canReply || !connected || busy} onClick={() => { closeTools(); setTemplates(true); }} aria-label="Choose template"><FiFileText /><span>Templates</span></button>
          <button type="button" disabled={!canReply || busy} onClick={() => { closeTools(); setActions(true); }} aria-label="Chat actions"><HiOutlineSparkles /><span>Actions</span></button>
        </div>
        {emojiOpen && <div className={s.composerEmojiGrid}>{[['😊','Smile'],['👍','Thumbs up'],['🙏','Thanks'],['✅','Check'],['🎉','Celebrate'],['❤️','Heart'],['👋','Wave'],['✨','Sparkles']].map(([emoji,label]) => <button type="button" key={label} aria-label={label} onMouseDown={event => event.preventDefault()} onClick={() => { if (note) noteEditor.current?.insertText(emoji); else { const position = input.current?.selectionStart ?? text.length; setText(text.slice(0,position) + emoji + text.slice(input.current?.selectionEnd ?? position)); input.current?.focus(); } closeTools(); }}>{emoji}</button>)}</div>}
      </div></details>
      <div className={s.composerInput}>
      <div hidden={!note}><NoteEditor ref={noteEditor} value={noteText} staff={session.staff} quickReplies={quick} actorId={session.actor.id} disabled={disabled || busy} onChange={(value, ids) => { setNoteText(value); setMentions(ids); }} onSend={send} /></div>
      {!note && (!windowOpen && connected ? <div className={s.closedWindow}><FiClock /><div><b>Continue with a template</b><p>The 24-hour reply window has ended.</p></div><button disabled={!canReply} className={s.secondary} onClick={() => setTemplates(true)}>Choose template</button></div> : <textarea rows={1} ref={input} aria-label="Message" placeholder="Write a message…" value={replyText} disabled={disabled || busy} maxLength={attachment ? 1024 : 4096} onChange={event => { setReplyText(event.target.value); detectSlash(event.target); if (event.target.value) pauseForTyping(); }} onClick={event => detectSlash(event.currentTarget)} onKeyDown={event => { if (slash && !event.nativeEvent.isComposing) { if (event.key === 'Escape') { event.preventDefault(); setSlash(null); return; } if (['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); setQuickIndex(old => (old + (event.key === 'ArrowDown' ? 1 : -1) + Math.max(1, quickMatches.length)) % Math.max(1, quickMatches.length)); return; } if (['Enter', 'Tab'].includes(event.key)) { event.preventDefault(); if (quickMatches[quickIndex]) insertQuick(quickMatches[quickIndex]); return; } } if (event.key === 'Enter' && !window.matchMedia('(max-width: 900px), (pointer: coarse)').matches && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />)}
      </div>
<button className={`${s.send} ${note || !hasContent ? s.noteAction : ''}`} aria-label={hasContent ? note ? 'Send internal note' : 'Send message' : note ? 'Cancel internal note' : 'Write internal note'} aria-busy={busy} disabled={busy || !canReply || (hasContent && disabled)} onClick={() => { if (hasContent) send(); else { setNote(!note); setError(''); } }}>{busy ? <span className={s.sendSpinner} role="status" aria-label="Sending" /> : <>{hasContent ? 'Send' : 'Note'}{hasContent ? <FiSend /> : note ? <FiX /> : <FiFileText />}</>}</button>
      </div>
      <input type="file" ref={file} hidden accept="image/png,image/jpeg,application/pdf,video/mp4,audio/mpeg,audio/ogg" onChange={upload} />
    </div>
    {actions && <ChatActions conversation={conversation} session={session} onClose={() => setActions(false)} onSent={onSent} />}
    {templates && <Modal title="Send a template" onClose={() => setTemplates(false)}><Templates session={session} conversation={conversation} onSent={async () => { setTemplates(false); await onSent(); }} /></Modal>}
  </div>;
}


