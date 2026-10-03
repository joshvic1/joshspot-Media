import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import s from '../../styles/Inbox.module.css';
export default function Modal({ title, children, onClose, drawer = false, footer }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current; const focus = document.activeElement;
    element.showModal();
    const resize = () => element.style.setProperty('--sheet-height', `${window.visualViewport?.height || window.innerHeight}px`);
    resize(); window.visualViewport?.addEventListener('resize', resize);
    return () => { window.visualViewport?.removeEventListener('resize', resize); element.close(); focus?.focus(); };
  }, []);
  return <dialog className={`${s.modal} ${drawer ? s.drawer : ''}`} ref={dialog} onCancel={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }} aria-label={title}><div className={s.sheetHandle} aria-hidden="true" /><header><h2>{title}</h2><button type="button" className={s.iconButton} onClick={onClose} aria-label="Close"><FiX /></button></header><div className={s.sheetBody}>{children}</div>{footer && <footer className={s.sheetFooter}>{footer}</footer>}</dialog>;
}
