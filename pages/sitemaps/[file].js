import { blogFetch, siteUrl } from '../../utils/blogServer';
import { sendXml, xmlEscape } from '../../utils/sitemap';
export default function Sitemap() { return null; }
export async function getServerSideProps({ params, res }) {
  const match = /^blog-([1-9]\d*)\.xml$/.exec(params.file);
  if (!match || Number(match[1]) > 100000) return { notFound: true };
  try {
    const rows = await blogFetch(`sitemap?page=${match[1]}`);
    if (!rows.length && match[1] !== '1') return { notFound: true };
    sendXml(res, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.map(row => `<url><loc>${xmlEscape(siteUrl + '/blog/' + row.slug)}</loc>${row.seoUpdatedAt ? `<lastmod>${xmlEscape(new Date(row.seoUpdatedAt).toISOString())}</lastmod>` : ''}</url>`).join('')}</urlset>`);
  } catch { res.statusCode = 503; res.setHeader('Cache-Control', 'no-store'); res.end('Sitemap temporarily unavailable'); }
  return { props: {} };
}
