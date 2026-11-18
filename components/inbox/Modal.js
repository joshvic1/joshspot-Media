import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import s from '../../styles/Inbox.module.css';
export default function Modal({ title, children, onClose, drawer = false, footer }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current; const focus = document.activeElement; const viewport = window.visualViewport;
    let frame = 0; let timers = [];
    element.showModal();
    const sync = () => {
      frame = 0;
      const height = viewport?.height || window.innerHeight;
      const offsetTop = viewport?.offsetTop || 0;
      // iOS may leave the layout viewport full-height while drawing its keyboard
      // over the visual viewport. Keep a bottom sheet above that covered area.
      const coveredBottom = Math.max(0, window.innerHeight - height - offsetTop);
      element.style.setProperty('--sheet-height', `${height}px`);
      element.style.setProperty('--sheet-bottom', `${coveredBottom}px`);
      element.dataset.keyboardOpen = String(coveredBottom > 0 || window.innerHeight - height > 150);
    };
    const resize = () => { if (!frame) frame = window.requestAnimationFrame(sync); };
    const settleFocus = () => {
      resize();
      timers.forEach(window.clearTimeout);
      timers = [80, 240, 500].map(delay => window.setTimeout(() => {
        resize();
        const active = document.activeElement;
        if (active && element.contains(active)) active.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }, delay));
    };
    sync(); viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize);
    window.addEventListener('resize', resize); element.addEventListener('focusin', settleFocus);
    return () => { window.cancelAnimationFrame(frame); timers.forEach(window.clearTimeout); viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); window.removeEventListener('resize', resize); element.removeEventListener('focusin', settleFocus); element.close(); focus?.focus(); };
  }, []);
  return <dialog className={`${s.modal} ${drawer ? s.drawer : ''}`} ref={dialog} onCancel={event=>{event.preventDefault();onClose();}} onClick={(event) => { if (event.target === dialog.current) onClose(); }} aria-label={title}><div className={s.sheetHandle} aria-hidden="true" /><header><h2>{title}</h2><button type="button" className={s.iconButton} onClick={onClose} aria-label="Close"><FiX /></button></header><div className={s.sheetBody}>{children}</div>{footer && <footer className={s.sheetFooter}>{footer}</footer>}</dialog>;
}
