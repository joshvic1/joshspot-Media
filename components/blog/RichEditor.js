import {useEffect,useRef,useState} from 'react';
import {useEditor,EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import {TableKit} from '@tiptap/extension-table';
import {TextStyle,Color,BackgroundColor} from '@tiptap/extension-text-style';
import {FiBold,FiItalic,FiUnderline,FiList,FiLink,FiImage,FiRotateCcw,FiRotateCw,FiAlignLeft,FiAlignCenter,FiAlignRight,FiMinus,FiGrid,FiType} from 'react-icons/fi';
import {uploadImage} from './api';
import s from '../../styles/BlogAdmin.module.css';
import p from '../../styles/Blog.module.css';
export default function RichEditor({value,onChange,onBusy,disabled}){
  const file=useRef(null),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[link,setLink]=useState(null),[alt,setAlt]=useState('');
  const editor=useEditor({immediatelyRender:false,shouldRerenderOnTransaction:true,extensions:[StarterKit.configure({heading:{levels:[2,3,4]},link:{openOnClick:false}}),Image,TextAlign.configure({types:['heading','paragraph']}),TableKit,TextStyle,Color,BackgroundColor],content:value||'<p></p>',onUpdate:({editor})=>onChange(editor.getHTML()),editorProps:{attributes:{class:p.prose,'aria-label':'Article content',role:'textbox','aria-multiline':'true'},handlePaste:(view,event)=>{const image=[...(event.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));if(image&&!event.clipboardData.getData('text/html')){event.preventDefault();addImage(image);return true;}return false;},handleDrop:(view,event,slice,moved)=>{const image=event.dataTransfer?.files?.[0];if(image&&!moved){event.preventDefault();addImage(image);return true;}return false;}}});
  useEffect(()=>{editor?.setEditable(!disabled&&!uploading,false);},[editor,disabled,uploading]);
  async function addImage(image){if(!image||uploading)return;setUploading(true);onBusy(true);setError('');const position=editor.state.selection.from;editor.setEditable(false,false);try{const src=await uploadImage(image);editor.chain().focus().insertContentAt(position,[{type:'image',attrs:{src,alt}},{type:'paragraph'}]).run();setAlt('');}catch(e){setError(e.message);}finally{editor.setEditable(true,false);setUploading(false);onBusy(false);if(file.current)file.current.value='';}}
  if(!editor)return <div className={s.editorLoading}>Preparing your editor…</div>;
  const button=(label,Icon,action,active=false)=><button key={label} type="button" title={label} aria-label={label} aria-pressed={active} onClick={action} disabled={uploading} className={active?s.selected:''}><Icon/></button>;
  return <div className={s.editor}><div className={s.tools} role="toolbar" aria-label="Text formatting">
    <select aria-label="Paragraph style" value={editor.isActive('heading',{level:2})?'2':editor.isActive('heading',{level:3})?'3':editor.isActive('heading',{level:4})?'4':'p'} onChange={e=>e.target.value==='p'?editor.chain().focus().setParagraph().run():editor.chain().focus().toggleHeading({level:Number(e.target.value)}).run()}><option value="p">Paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select>
    {button('Bold',FiBold,()=>editor.chain().focus().toggleBold().run(),editor.isActive('bold'))}{button('Italic',FiItalic,()=>editor.chain().focus().toggleItalic().run(),editor.isActive('italic'))}{button('Underline',FiUnderline,()=>editor.chain().focus().toggleUnderline().run(),editor.isActive('underline'))}
    {button('Bullet list',FiList,()=>editor.chain().focus().toggleBulletList().run(),editor.isActive('bulletList'))}<button type="button" aria-label="Numbered list" onClick={()=>editor.chain().focus().toggleOrderedList().run()}>1.</button><button type="button" aria-label="Quote" onClick={()=>editor.chain().focus().toggleBlockquote().run()}>“</button>
    {button('Align left',FiAlignLeft,()=>editor.chain().focus().setTextAlign('left').run())}{button('Align center',FiAlignCenter,()=>editor.chain().focus().setTextAlign('center').run())}{button('Align right',FiAlignRight,()=>editor.chain().focus().setTextAlign('right').run())}
    {button('Insert link',FiLink,()=>setLink(editor.getAttributes('link').href||''))}{button('Insert image',FiImage,()=>file.current.click())}{button('Divider',FiMinus,()=>editor.chain().focus().setHorizontalRule().run())}{button('Insert table',FiGrid,()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run())}
    <label className={s.color} title="Text color"><FiType/><input type="color" aria-label="Text color" value={editor.getAttributes('textStyle').color||'#17243d'} onChange={e=>editor.chain().focus().setColor(e.target.value).run()}/></label>
    {button('Undo',FiRotateCcw,()=>editor.chain().focus().undo().run())}{button('Redo',FiRotateCw,()=>editor.chain().focus().redo().run())}
  </div>
  {link!==null&&<div className={s.inlinePanel}><input aria-label="Link URL" type="url" placeholder="https://…" value={link} onChange={e=>setLink(e.target.value)}/><button type="button" onClick={()=>{if(!link.trim()){editor.chain().focus().unsetLink().run();setLink(null);}else if(/^(https?:\/\/|mailto:|tel:)/i.test(link)){editor.chain().focus().extendMarkRange('link').setLink({href:link}).run();setLink(null);}else setError('Use a full https:// link.');}}>Apply link</button><button type="button" onClick={()=>setLink(null)}>Cancel</button></div>}
  {editor.isActive('table')&&<div className={s.inlinePanel}>{[['Add row',()=>editor.chain().focus().addRowAfter().run()],['Add column',()=>editor.chain().focus().addColumnAfter().run()],['Remove row',()=>editor.chain().focus().deleteRow().run()],['Remove table',()=>editor.chain().focus().deleteTable().run()]].map(([label,action])=><button type="button" key={label} onClick={action}>{label}</button>)}</div>}
  {editor.isActive('image')&&<div className={s.inlinePanel}><label>Image description<input aria-label="Inline image description" value={editor.getAttributes('image').alt||''} onChange={e=>editor.chain().updateAttributes('image',{alt:e.target.value}).run()} placeholder="Describe this image for readers"/></label><button type="button" onClick={()=>editor.chain().focus().deleteSelection().run()}>Remove image</button></div>}
  <input ref={file} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>addImage(e.target.files?.[0])}/>
  {error&&<p role="alert" className={s.error}>{error}</p>}{uploading&&<p role="status" className={s.hint}>Uploading image…</p>}
  <EditorContent editor={editor}/><div className={s.editorFoot}><span>{editor.getText().split(/\s+/).filter(Boolean).length} words</span><span>Paste formatted text, or drop an image here.</span></div>
  </div>;
}
