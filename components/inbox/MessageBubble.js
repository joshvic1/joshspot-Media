import { useEffect, useRef, useState } from 'react';
import s from '../../styles/Inbox.module.css';
export default function MessageBubble({ message, className, selected, canReply, onReply, onOpen, children }) {
  const gesture = useRef(null); const timer = useRef(null); const suppress = useRef(false); const [offset, setOffset] = useState(0);
  const replyable = canReply && message.providerId && message.direction !== 'internal' && !['queued','sending','failed','unknown'].includes(message.status);
  const direction = message.direction === 'outbound' ? -1 : 1;
  const clear = () => { clearTimeout(timer.current); timer.current = null; };
  useEffect(() => () => clearTimeout(timer.current), []);
  return <article className={`${className} ${s.gestureBubble} ${selected ? s.selectedMessage : ''}`} tabIndex={0} aria-label="Message; hold or open context menu for actions" style={{ transform: `translateX(${offset}px)`, transition: offset ? 'none' : 'transform 180ms ease-out' }}
    onPointerDown={event => {
      if (event.button !== 0 || event.target.closest('input,audio,video')) return;
      suppress.current = false; gesture.current = { x:event.clientX, y:event.clientY, id:event.pointerId };
      clear(); timer.current = setTimeout(() => { suppress.current = true; gesture.current = null; setOffset(0); onOpen(message); }, 500);
    }}
    onPointerMove={event => {
      const start = gesture.current; if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX-start.x, dy = event.clientY-start.y;
      if (Math.abs(dx)>8 || Math.abs(dy)>8) clear();
      if (Math.abs(dy)>25 && !offset) { gesture.current=null; return; }
      if (replyable && dx*direction>8 && Math.abs(dx)>Math.abs(dy)*1.5) { suppress.current=true; setOffset(direction*Math.min(88,dx*direction)); }
    }}
    onPointerUp={event => { clear(); const start=gesture.current; gesture.current=null; if (start && replyable && (event.clientX-start.x)*direction>=60 && Math.abs(event.clientY-start.y)<30) { suppress.current=true; onReply(message); } setOffset(0); }}
    onPointerCancel={() => { clear(); gesture.current=null; setOffset(0); }}
    onPointerLeave={event => { if(event.pointerType==='mouse'){clear();gesture.current=null;setOffset(0);} }}
    onClickCapture={event => { if(suppress.current){event.preventDefault();event.stopPropagation();suppress.current=false;} }}
    onContextMenu={event => { event.preventDefault(); clear(); suppress.current=true; onOpen(message); }}
    onKeyDown={event => { if(event.target===event.currentTarget && (event.key==='Enter'||event.key===' '||(event.shiftKey&&event.key==='F10'))){event.preventDefault();onOpen(message);} }}>
    {children}
  </article>;
}
