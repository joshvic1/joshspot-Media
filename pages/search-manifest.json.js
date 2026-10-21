import { createHash } from 'node:crypto';
import { staticPublicPaths, getSeo } from '../config/seo';
import contentHashes from '../config/search-content-hashes.json';
export default function Manifest() { return null; }
export async function getServerSideProps({ res }) {
  const pages = staticPublicPaths().map(path => ({ path, fingerprint: createHash('sha256').update(JSON.stringify({ meta: path.startsWith('/services/') ? getSeo('/services/[slug]', { slug: path.split('/').pop() }) : getSeo(path), content: contentHashes[path] || contentHashes.shared })).digest('hex') }));
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  res.end(JSON.stringify({ version: 1, pages }));
  return { props: {} };
}
