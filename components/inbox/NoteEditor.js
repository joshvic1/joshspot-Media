import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import s from '../../styles/Inbox.module.css';

// Staff tokens are DOM nodes created locally, never HTML parsed from a draft.
const NoteEditor = forwardRef(function NoteEditor({ value, staff, actorId, disabled, onChange, onSend }, ref) {
  const editor = useRef(null); const selection = useRef(null); const trigger = useRef(null);
  const [query, setQuery] = useState(null); const [active, setActive] = useState(0); const listId = useId();
  const matches = staff.filter(person => person._id !== actorId && person.name.toLowerCase().includes((query || '').toLowerCase())).slice(0, 10);
  const read = () => (editor.current?.innerText || '').replace(/\u00a0/g, ' ').replace(/\n$/, '');
  const emit = () => onChange(read(), [...new Set([...editor.current.querySelectorAll('[data-staff-id]')].map(node => node.dataset.staffId))]);
  const remember = () => {
    const selected = window.getSelection();
    if (!selected?.rangeCount || !editor.current.contains(selected.anchorNode)) return;
    const range = selected.getRangeAt(0); selection.current = range.cloneRange();
    if (!range.collapsed || range.startContainer.nodeType !== Node.TEXT_NODE) { setQuery(null); return; }
    const prefix = range.startContainer.textContent.slice(0, range.startOffset);
    const found = /(?:^|\s)@([^@\n]{0,40})$/.exec(prefix);
    if (!found) { setQuery(null); return; }
    const start = prefix.lastIndexOf('@'); const tokenRange = range.cloneRange();
    tokenRange.setStart(range.startContainer, start); trigger.current = tokenRange;
    setQuery(found[1]); setActive(0);
  };
  const insert = (text, person) => {
    const root = editor.current; root.focus();
    let range = person ? trigger.current : selection.current;
    if (!range || !root.contains(range.startContainer)) { range = document.createRange(); range.selectNodeContents(root); range.collapse(false); }
    if (person && new Set([...root.querySelectorAll('[data-staff-id]')].map(node => node.dataset.staffId)).size >= 10 && !root.querySelector(`[data-staff-id="${person._id}"]`)) return;
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    if (person) { const token = document.createElement('strong'); token.textContent = `@${person.name}`; token.dataset.staffId = person._id; token.contentEditable = 'false'; fragment.append(token); }
    const tail = document.createTextNode(person ? '\u00a0' : text); fragment.append(tail); range.insertNode(fragment);
    range.setStartAfter(tail); range.collapse(true); const selected = window.getSelection(); selected.removeAllRanges(); selected.addRange(range);
    selection.current = range.cloneRange(); setQuery(null); emit();
  };
  useImperativeHandle(ref, () => ({ insertText: text => insert(text), focus: () => editor.current.focus() }));
  useEffect(() => {
    // Ordinary keystrokes are already in the DOM; only external resets replace it.
    if (read() !== value) { editor.current.textContent = value; selection.current = null; trigger.current = null; }
  }, [value]);
  return <div className={s.inlineNoteWrap}>
    {query !== null && !disabled && <div className={s.staffSuggestions} role="listbox" id={listId} aria-label="Mention staff">{matches.length ? matches.map((person, index) => <button type="button" role="option" id={`${listId}-${index}`} aria-selected={index === active} key={person._id} onMouseDown={event => event.preventDefault()} onClick={() => insert('', person)}><span>{person.name.slice(0, 1)}</span><strong>{person.name}</strong><small>{person.role}</small></button>) : <p>No matching staff</p>}</div>}
    <div ref={editor} role="textbox" aria-label="Internal note" aria-multiline="true" aria-autocomplete="list" aria-controls={query !== null ? listId : undefined} aria-activedescendant={query !== null && matches[active] ? `${listId}-${active}` : undefined} aria-disabled={disabled} contentEditable={!disabled} suppressContentEditableWarning className={s.inlineNoteEditor} data-placeholder="Internal note · @ to mention staff" onInput={() => { if (read().length > 10000) { editor.current.textContent = value; emit(); setQuery(null); return; } emit(); remember(); }} onClick={remember} onKeyUp={event => { if (!['ArrowUp', 'ArrowDown', 'Escape', 'Enter', 'Tab'].includes(event.key)) remember(); }} onBlur={() => setTimeout(() => setQuery(null), 150)} onPaste={event => { event.preventDefault(); insert(event.clipboardData.getData('text/plain').slice(0, Math.max(0, 10000 - read().length))); }} onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      if (query !== null) {
        if (event.key === 'Escape') { event.preventDefault(); setQuery(null); return; }
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + Math.max(1, matches.length)) % Math.max(1, matches.length)); return; }
        if ((event.key === 'Enter' || event.key === 'Tab') && matches[active]) { event.preventDefault(); insert('', matches[active]); return; }
      }
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); }
    }} />
  </div>;
});
export default NoteEditor;

