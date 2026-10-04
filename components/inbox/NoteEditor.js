import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import s from '../../styles/Inbox.module.css';

// Staff tokens are DOM nodes created locally, never HTML parsed from a draft.
const NoteEditor = forwardRef(function NoteEditor({ value, staff, quickReplies = [], actorId, disabled, onChange, onSend }, ref) {
  const editor = useRef(null); const selection = useRef(null); const trigger = useRef(null);
  const [shortcut, setShortcut] = useState(false);
  const [query, setQuery] = useState(null); const [active, setActive] = useState(0); const listId = useId();
  const matches = shortcut ? quickReplies.filter(item => item.keyword.includes((query || '').toLowerCase())).slice(0, 10).map(item => ({ ...item, name: '/' + item.keyword })) : staff.filter(person => person._id !== actorId && person.name.toLowerCase().includes((query || '').toLowerCase())).slice(0, 10);
  const read = () => (editor.current?.innerText || '').replace(/\u00a0/g, ' ').replace(/\n$/, '');
  const emit = () => onChange(read(), [...new Set([...editor.current.querySelectorAll('[data-staff-id]')].map(node => node.dataset.staffId))]);
  const deleteMention = (event) => {
    const backward = event.inputType === 'deleteContentBackward' || event.key === 'Backspace';
    const forward = event.inputType === 'deleteContentForward' || event.key === 'Delete';
    if ((!backward && !forward) || event.isComposing) return;
    const selected = window.getSelection();
    if (!selected?.rangeCount) return;
    const range = selected.getRangeAt(0); const root = editor.current;
    if (!range.collapsed || !root.contains(range.startContainer)) return;
    let node = range.startContainer; const offset = range.startOffset;
    if (node.nodeType === Node.TEXT_NODE) {
      if (backward ? offset !== 0 : offset !== node.length) return;
      node = backward ? node.previousSibling : node.nextSibling;
    } else node = node.childNodes[backward ? offset - 1 : offset];
    while (node?.nodeType === Node.TEXT_NODE && !node.textContent) node = backward ? node.previousSibling : node.nextSibling;
    if (!node?.matches?.('[data-staff-id]')) return;
    event.preventDefault();
    const caret = document.createRange(); caret.setStartBefore(node); node.remove(); caret.collapse(true);
    selected.removeAllRanges(); selected.addRange(caret); selection.current = caret.cloneRange();
    setQuery(null); emit();
  };
  // Phone keyboards often send beforeinput without a Backspace keydown.
  useEffect(() => {
    const root = editor.current;
    root.addEventListener('beforeinput', deleteMention);
    return () => root.removeEventListener('beforeinput', deleteMention);
  });
  const remember = () => {
    const selected = window.getSelection();
    if (!selected?.rangeCount || !editor.current.contains(selected.anchorNode)) return;
    const range = selected.getRangeAt(0); selection.current = range.cloneRange();
    if (!range.collapsed || range.startContainer.nodeType !== Node.TEXT_NODE) { setQuery(null); return; }
    const prefix = range.startContainer.textContent.slice(0, range.startOffset);
    const found = /(?:^|\s)([@/])([^@/\n]{0,40})$/.exec(prefix);
    if (!found) { setQuery(null); return; }
    const start = prefix.lastIndexOf(found[1]); const tokenRange = range.cloneRange();
    tokenRange.setStart(range.startContainer, start); trigger.current = tokenRange;
    setShortcut(found[1] === '/'); setQuery(found[2]); setActive(0);
  };
  const insert = (text, person) => {
    const root = editor.current; root.focus();
    let range = person ? trigger.current : selection.current;
    if (!range || !root.contains(range.startContainer)) { range = document.createRange(); range.selectNodeContents(root); range.collapse(false); }
    if (person && !person.response && new Set([...root.querySelectorAll('[data-staff-id]')].map(node => node.dataset.staffId)).size >= 10 && !root.querySelector(`[data-staff-id="${person._id}"]`)) return;
    if (person?.response && read().length + person.response.length - range.toString().length > 10000) return;
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    if (person?.response) { fragment.append(document.createTextNode(person.response)); }
    else if (person) { const token = document.createElement('strong'); token.textContent = `@${person.name}`; token.dataset.staffId = person._id; token.contentEditable = 'false'; fragment.append(token); }
    const tail = document.createTextNode(person ? '\u00a0' : text); fragment.append(tail); range.insertNode(fragment);
    range.setStart(tail, tail.length); range.collapse(true); const selected = window.getSelection(); selected.removeAllRanges(); selected.addRange(range);
    selection.current = range.cloneRange(); setQuery(null); emit();
  };
  useImperativeHandle(ref, () => ({ insertText: text => insert(text), focus: () => editor.current.focus() }));
  useEffect(() => {
    // Ordinary keystrokes are already in the DOM; only external resets replace it.
    if (read() !== value) { editor.current.textContent = value; selection.current = null; trigger.current = null; }
  }, [value]);
  return <div className={s.inlineNoteWrap}>
    {query !== null && !disabled && <div className={s.staffSuggestions} role="listbox" id={listId} aria-label={shortcut ? "Quick replies" : "Mention staff"}>{matches.length ? matches.map((person, index) => <button type="button" role="option" id={`${listId}-${index}`} aria-selected={index === active} key={person._id} onMouseDown={event => event.preventDefault()} onClick={() => insert('', person)}><span>{person.name.slice(0, 1)}</span><strong>{person.name}</strong><small>{person.role || person.response?.slice(0, 60)}</small></button>) : <p>{shortcut ? "No matching quick replies" : "No matching staff"}</p>}</div>}
    <div ref={editor} role="textbox" aria-label="Internal note" aria-multiline="true" aria-autocomplete="list" aria-controls={query !== null ? listId : undefined} aria-activedescendant={query !== null && matches[active] ? `${listId}-${active}` : undefined} aria-disabled={disabled} contentEditable={!disabled} suppressContentEditableWarning className={s.inlineNoteEditor} data-placeholder="Internal note · @ to mention staff" onInput={() => { if (read().length > 10000) { editor.current.textContent = value; emit(); setQuery(null); return; } emit(); remember(); }} onClick={remember} onKeyUp={event => { if (!['ArrowUp', 'ArrowDown', 'Escape', 'Enter', 'Tab'].includes(event.key)) remember(); }} onBlur={() => setTimeout(() => setQuery(null), 150)} onPaste={event => { event.preventDefault(); insert(event.clipboardData.getData('text/plain').slice(0, Math.max(0, 10000 - read().length))); }} onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      deleteMention(event);
      if (event.defaultPrevented) return;
      if (query !== null) {
        if (event.key === 'Escape') { event.preventDefault(); setQuery(null); return; }
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + Math.max(1, matches.length)) % Math.max(1, matches.length)); return; }
        if ((event.key === 'Enter' || event.key === 'Tab') && matches[active]) { event.preventDefault(); insert('', matches[active]); return; }
      }
      if (event.key === 'Enter' && !window.matchMedia('(max-width: 900px), (pointer: coarse)').matches && !event.shiftKey) { event.preventDefault(); onSend(); }
    }} />
  </div>;
});
export default NoteEditor;

