import Link from 'next/link';
import {FiArrowUpRight,FiBookOpen,FiArrowLeft,FiArrowRight} from 'react-icons/fi';
import PublicLayout from '../../components/PublicLayout';
import {blogFetch} from '../../utils/blogServer';
import s from '../../styles/Blog.module.css';
export default function Blog({data,unavailable}){
  return <PublicLayout>
    <section className={s.hero}><div><span className={s.eyebrow}>THE JOSHSPOT JOURNAL</span><h1>Good ideas.<br/><em>Better marketing.</em></h1><p>Practical guides, fresh perspectives and lessons to help your business make its next move.</p></div><div className={s.heroArt} aria-hidden="true"><FiBookOpen/><span>Learn. Apply. Grow.</span><i>j.</i></div></section>
    <div className={s.sectionTitle}><h2>Explore the journal</h2><span>{data.total} {data.total===1?'article':'articles'}</span></div>
    {data.items.length?<div className={s.grid}>{data.items.map((post,index)=><Link href={`/blog/${post.slug}`} key={post._id} className={`${s.card} ${index===0&&data.page===1?s.featured:''}`}><div className={s.cardImage}>{post.cover?<img src={post.cover} alt={post.coverAlt||''} loading={index===0?'eager':'lazy'}/>:<div className={s.imagePlaceholder}><FiBookOpen/><span>JOSHSPOT MEDIA</span></div>}</div><div className={s.cardCopy}><span className={s.category}>{post.category||'Insights'}</span><h2>{post.title}</h2><p>{post.excerpt}</p><span className={s.readLink}>Read article <FiArrowUpRight/></span></div></Link>)}</div>:<div className={s.empty}><FiBookOpen/><h2>{unavailable?'The journal is taking a short break':'A little inspiration is on its way'}</h2><p>{unavailable?'Please refresh in a moment.':'Our first articles will appear here soon. In the meantime, explore our training and services.'}</p><Link href="/#learn">Explore our training <FiArrowUpRight/></Link></div>}
    {data.pages>1&&<nav className={s.pagination} aria-label="Blog pages">{data.page>1?<Link href={`/blog?page=${data.page-1}`}><FiArrowLeft/> Previous</Link>:<span/>}<span>Page {data.page} of {data.pages}</span>{data.page<data.pages?<Link href={`/blog?page=${data.page+1}`}>Next <FiArrowRight/></Link>:<span/>}</nav>}
  </PublicLayout>;
}
export async function getServerSideProps({query,res}){
  const page=Math.max(1,parseInt(query.page,10)||1);
  try{const data=await blogFetch(`posts?page=${page}`);if(page>data.pages)return {notFound:true};return {props:{data}};}
  catch{res.statusCode=503;return {props:{unavailable:true,data:{items:[],total:0,page:1,pages:1}}};}
}
