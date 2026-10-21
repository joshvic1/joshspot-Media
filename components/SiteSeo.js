import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSeo, siteUrl } from '../config/seo';
import { services } from '../config/services';

const absolute = path => path?.startsWith('/') ? siteUrl + path : path;
export default function SiteSeo({ pageProps }) {
  const router = useRouter();
  const meta = getSeo(router.pathname, pageProps);
  const noindex = meta.noindex || router.query.preview !== undefined;
  const url = meta.canonical && siteUrl + meta.canonical;
  const image = absolute(meta.image && !meta.image.endsWith('.svg') ? meta.image : '/images/joshua.png');
  const organization = { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Joshspot Media', url: siteUrl + '/', founder: { '@id': `${siteUrl}/#josh` }, sameAs: ['https://instagram.com/joshspotmedia', 'https://youtube.com/@joshspot_tv'] };
  const graph = [organization,
    { '@type': 'Person', '@id': `${siteUrl}/#josh`, name: 'Josh', image: `${siteUrl}/images/joshua.png`, worksFor: { '@id': organization['@id'] } },
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'Joshspot Media', url: siteUrl + '/', publisher: { '@id': organization['@id'] } },
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: meta.title, description: meta.description, inLanguage: 'en', isPartOf: { '@id': `${siteUrl}/#website` } },
  ];
  if (url && meta.canonical !== '/') {
    const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` }];
    if (meta.canonical.startsWith('/services/')) crumbs.push({ '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` });
    if (meta.article) crumbs.push({ '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` });
    crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: meta.article || meta.title.split(' | ')[0], item: url });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs });
  }
  const service = services.find(item => item.slug === meta.serviceSlug);
  if (service) {
    const training = /training/.test(service.slug);
    graph.push({ '@type': training ? 'Course' : 'Service', '@id': `${url}#offering`, name: service.title, description: service.description, url, provider: { '@id': organization['@id'] },
      ...(!service.resource ? { offers: (service.options || [{ label: service.title, price: service.price }]).filter(o => Number.isFinite(o.price)).map(o => ({ '@type': 'Offer', name: o.label, price: o.price, priceCurrency: 'NGN', url })) } : {}) });
  }
  if (meta.course) graph.push({ '@type': 'Course', '@id': `${url}#course`, name: meta.course, description: meta.description, url, provider: { '@id': organization['@id'] }, offers: { '@type': 'Offer', price: meta.price, priceCurrency: 'NGN', url } });
  if (meta.article) graph.push({ '@type': 'Article', headline: meta.article, description: meta.description, url, mainEntityOfPage: { '@id': `${url}#webpage` }, image, publisher: { '@id': organization['@id'] } });
  return <Head>
    <title>{meta.title}</title>
    <meta key="robots" name="robots" content={noindex ? `noindex,${meta.follow ? 'follow' : 'nofollow'},nosnippet` : 'index,follow,max-image-preview:large'} />
    {meta.description && <meta key="description" name="description" content={meta.description} />}
    {url && <link rel="canonical" href={url} key="canonical" />}
    {!noindex && [
      <meta key="og:site_name" property="og:site_name" content="Joshspot Media" />,
      <meta key="og:type" property="og:type" content={meta.article ? 'article' : 'website'} />,
      <meta key="og:title" property="og:title" content={meta.title} />,
      <meta key="og:description" property="og:description" content={meta.description} />,
      <meta key="og:url" property="og:url" content={url} />,
      <meta key="og:image" property="og:image" content={image} />,
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />,
      <meta key="twitter:title" name="twitter:title" content={meta.title} />,
      <meta key="twitter:description" name="twitter:description" content={meta.description} />,
      <meta key="twitter:image" name="twitter:image" content={image} />,
      <script key="structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') }} />,
    ]}
  </Head>;
}
