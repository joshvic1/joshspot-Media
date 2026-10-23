import {Node} from '@tiptap/core';

export function videoUrl(value){
  try {
    const url=new URL(value.trim());
    if(!['https:','http:'].includes(url.protocol))return null;
    const host=url.hostname.replace(/^www\./,'');
    let id;
    if(host==='youtu.be')id=url.pathname.slice(1);
    if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host))id=url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    if(id&&/^[\w-]{11}$/.test(id))return `https://www.youtube-nocookie.com/embed/${id}`;
    if(['vimeo.com','player.vimeo.com'].includes(host)){
      id=url.pathname.match(/^\/(?:video\/)?(\d+)\/?$/)?.[1];
      if(id)return `https://player.vimeo.com/video/${id}`;
    }
  }catch{}
  return null;
}

export default Node.create({
  name:'videoEmbed',group:'block',atom:true,draggable:true,
  addAttributes(){return {src:{default:null},title:{default:'Embedded video'}}},
  parseHTML(){return [{tag:'iframe[src]',getAttrs:element=>{const src=videoUrl(element.getAttribute('src')||'');return src?{src,title:element.getAttribute('title')||'Embedded video'}:false}}]},
  renderHTML({HTMLAttributes}){return ['iframe',{src:HTMLAttributes.src,title:HTMLAttributes.title,loading:'lazy',allowfullscreen:'true',allow:'fullscreen; picture-in-picture',referrerpolicy:'strict-origin-when-cross-origin'}]},
});
