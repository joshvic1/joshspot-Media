import Link from 'next/link';
import {FiArrowLeft,FiArrowUpRight} from 'react-icons/fi';
import PublicLayout from '../../components/PublicLayout';
import {blogFetch} from '../../utils/blogServer';
import s from '../../styles/Blog.module.css';
export default function Article({post,unavailable}){
  if(unavailable)return <PublicLayout><div className={s.empty}><h1>Please try again shortly</h1><p>This article is temporarily unavailable.</p><Link href="/blog">Back to the journal</Link></div></PublicLayout>;
  return <PublicLayout>
  <article className={s.article}><Link href="/blog" className={s.back}><FiArrowLeft/> Back to the journal</Link><header className={s.articleHeader}><span className={s.category}>{post.category||'Insights'}</span><h1>{post.title}</h1>{post.excerpt&&<p>{post.excerpt}</p>}</header>{post.cover&&<img className={s.cover} src={post.cover} alt={post.coverAlt||''} fetchPriority="high"/>}<div className={s.prose} dangerouslySetInnerHTML={{__html:post.html}}/><aside className={s.articleCta}><div><h2>Turn what you learn into your next move.</h2><p>Explore practical training and marketing support from Joshspot Media.</p></div><Link href="/#learn">Explore training <FiArrowUpRight/></Link></aside></article>
  </PublicLayout>;
}
export async function getServerSideProps({params,res}){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.slug))return {notFound:true};
  try{const post=await blogFetch(`posts/${params.slug}`);return post?{props:{post}}:{notFound:true};}
  catch{res.statusCode=503;return {props:{unavailable:true}};}
}
