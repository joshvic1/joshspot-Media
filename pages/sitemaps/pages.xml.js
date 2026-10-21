import { staticPublicPaths, siteUrl } from '../../config/seo';
import { sendXml, xmlEscape } from '../../utils/sitemap';
export default function Sitemap() { return null; }
export async function getServerSideProps({ res }) {
  sendXml(res, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticPublicPaths().map(path => `<url><loc>${xmlEscape(siteUrl + path)}</loc></url>`).join('')}</urlset>`);
  return { props: {} };
}
