import {blogFetch,siteUrl} from '../utils/blogServer';
import {sendXml,xmlEscape} from '../utils/sitemap';
export default function Sitemap(){return null;}
export async function getServerSideProps({res}){
  try {
    const meta=await blogFetch('sitemap-info');
    const paths=['/sitemaps/pages.xml',...Array.from({length:Math.max(1,meta.pages)},(_,i)=>`/sitemaps/blog-${i+1}.xml`)];
    sendXml(res,`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<sitemap><loc>${xmlEscape(siteUrl+path)}</loc></sitemap>`).join('')}</sitemapindex>`);
  } catch {res.statusCode=503;res.setHeader('Cache-Control','no-store');res.end('Sitemap temporarily unavailable');}
  return {props:{}};
}
