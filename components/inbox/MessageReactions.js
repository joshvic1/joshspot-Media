import { useEffect, useRef, useState } from 'react';
import { FiSmile } from 'react-icons/fi';
import { inboxApi } from './api';
import s from '../../styles/Inbox.module.css';

const choices = [['👍', 'Thumbs up'], ['❤️', 'Love'], ['😂', 'Laugh'], ['✅', 'Check'], ['🙏', 'Thanks'], ['😮', 'Surprised']];
export default function MessageReactions({ message, conversationId, actor, canReply, onUpdate, onError, menuMode = false }) {
  const [open, setOpen] = useState(false); const [position, setPosition] = useState({}); const [busy, setBusy] = useState(false); const root = useRef(null);
  const key = message.type === 'note' ? `staff_${actor.id}` : 'business';
  const current = message.reactions?.[key];
  const available = canReply && (message.type === 'note' || (message.providerId && !['failed', 'queued', 'sending', 'unknown'].includes(message.status)));
  useEffect(() => {
    if (!open) return;
    const close = event => { if (event.key === 'Escape' || (event.type === 'pointerdown' && !root.current?.contains(event.target))) setOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  async function react(emoji) {
    setBusy(true);
    try {
      await inboxApi(`/conversations/${conversationId}/messages/${message._id}/reaction`, { method: 'PUT', body: { emoji: current?.emoji === emoji && current.status !== 'failed' ? '' : emoji } });
      setOpen(false); await onUpdate();
    } catch (error) { onError(error.message); } finally { setBusy(false); }
  }
  const entries = Object.entries(message.reactions || {}).filter(([, reaction]) => reaction.emoji);
  return <div className={menuMode ? s.menuReactions : s.reactions} ref={root}>
    {entries.map(([id, reaction]) => <button key={id} className={s.reactionBadge} title={`${reaction.name || 'Customer'}${reaction.status === 'failed' ? ' · Reaction failed; tap to retry' : ''}`} aria-label={`${reaction.emoji} reaction by ${reaction.name || 'Customer'}${reaction.status === 'failed' ? ', failed' : ''}`} disabled={busy || !available || id !== key} onClick={() => react(reaction.emoji)}>{reaction.emoji}{reaction.status === 'failed' && <small>!</small>}</button>)}
    {available && !menuMode && <button className={s.reactionTrigger} aria-label="React to message" aria-expanded={open} onClick={() => { const box = root.current.getBoundingClientRect(); setPosition({ left: Math.max(12, Math.min(box.right - 216, window.innerWidth - 228)), top: Math.max(12, box.top - 50) }); setOpen(!open); }} disabled={busy}><FiSmile /></button>}
    {(open || (menuMode && available)) && <div className={menuMode ? s.menuReactionChoices : s.reactionPicker} style={menuMode ? undefined : position} role="group" aria-label={message.type === 'note' ? 'Team note reactions' : 'WhatsApp reactions'}>{choices.map(([emoji, label]) => <button key={emoji} title={label} aria-label={label} aria-pressed={current?.emoji === emoji} disabled={busy} onClick={() => react(emoji)}>{emoji}</button>)}</div>}
  </div>;
}
