import { services } from './services';

// Only reviewed public content belongs here. Unknown routes fail closed to noindex.
export const siteUrl = 'https://www.joshspotmedia.com';
export const publicPages = {
  '/': { title: 'TikTok & Meta ads training and services | Joshspot Media', description: 'Learn advertising with Josh or get practical support with TikTok and Meta ads account setup, audits, private coaching and video ad scripts.', image: '/images/joshua.png' },
  '/services': { title: 'Advertising services & training | Joshspot Media', description: 'Explore consultations, TikTok and Meta account setup, ads audits, private training, video scripts and free advertising resources from Joshspot Media.' },
  '/course': { title: 'TikTok, Facebook & Instagram ads course | Joshspot Media', description: 'Learn to run TikTok, Facebook and Instagram ads, choose your audience and plan your campaigns with the Joshspot Media video training course. ₦8,000.', image: '/images/ads-course.jpg', course: 'TikTok, Facebook and Instagram ads training', price: 8000 },
  '/whatsapp': { title: 'WhatsApp Status ads training | Joshspot Media', description: 'Learn how to run WhatsApp Status adverts with the Joshspot Media video training course. Explore the lessons and get access for ₦10,000.', image: '/images/ads-course.jpg', course: 'WhatsApp Status ads training', price: 10000 },
  '/video-script': { title: 'Video ad script writing | Joshspot Media', description: 'Get word-for-word video or voiceover copy for your business, with an attention-grabbing opening and a clear call to action. Book with Joshspot Media.', serviceSlug: 'video-ad-scripts' },
  '/blog': { title: 'Marketing insights & guides | Joshspot Media', description: 'Practical advertising guides, marketing ideas and lessons from Joshspot Media to help you plan your next move.' },
  '/privacy-policy': { title: 'Privacy policy | Joshspot Media', description: 'How Joshspot Media and Joshspot Inbox handle customer information, WhatsApp conversations and data deletion requests.' },
};
export const noindexPages = {
  '/tiktok-setup': 'TikTok account setup | Joshspot Media', // Owner: excluded until service promises are reviewed.
  '/start': 'Choose your next step | Joshspot Media',
  '/growth-assessment': 'Business growth assessment | Joshspot Media',
};
export function serviceSeo(service) {
  const title = service.slug === 'private-ads-training' ? 'One-on-one TikTok & Meta ads coaching with Josh' : service.title;
  return { title: `${title} | Joshspot Media`, description: service.description, image: service.image,
    canonical: service.slug === 'video-ad-scripts' ? '/video-script' : `/services/${service.slug}`, serviceSlug: service.slug };
}
export function staticPublicPaths() {
  return [...Object.keys(publicPages), ...services.map(serviceSeo).map(item => item.canonical)].filter((path, index, all) => all.indexOf(path) === index);
}
export function getSeo(pathname, props = {}) {
  if (props.unavailable) return { title: 'Temporarily unavailable | Joshspot Media', noindex: true };
  if (pathname === '/services/[slug]') {
    const service = services.find(item => item.slug === props.slug);
    if (service) return serviceSeo(service);
  }
  if (pathname === '/blog/[slug]' && props.post) {
    const p = props.post;
    return { title: `${p.seoTitle || p.title} | Joshspot Media`, description: p.seoDescription || p.excerpt, image: p.cover, canonical: `/blog/${p.slug}`, article: p.title };
  }
  if (publicPages[pathname]) return { ...publicPages[pathname], canonical: pathname === '/blog' && props.data?.page > 1 ? `/blog?page=${props.data.page}` : pathname };
  if (noindexPages[pathname]) return { title: noindexPages[pathname], canonical: pathname, noindex: true, follow: true };
  return { title: 'Joshspot Media', noindex: true };
}
