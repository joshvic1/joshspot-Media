// Local production build + synthetic blog API. No live search submissions or customer data.
const assert = require('node:assert/strict'), fs = require('node:fs'), http = require('node:http'), { spawn } = require('node:child_process');
const { chromium } = require('playwright');
let app, fixture, browser, unavailable = false;
const root = 'http://localhost:3026', origin = 'https://www.joshspotmedia.com';
const post = { slug: 'local-seo-fixture', title: 'A practical advertising guide', excerpt: 'A useful local test article.', html: '<h2>A clear goal</h2><p>Choose your advertising goal before you start.</p>', seoUpdatedAt: '2026-10-20T10:00:00.000Z' };
const report = [];
(async () => {
  fixture = http.createServer((req, res) => {
    const url = new URL(req.url, root); res.setHeader('Content-Type', 'application/json');
    if (unavailable) { res.statusCode = 503; return res.end('{}'); }
    if (url.pathname === '/api/blog/sitemap-info') return res.end('{"pages":1}');
    if (url.pathname === '/api/blog/sitemap') return res.end(JSON.stringify([post]));
    if (url.pathname === '/api/blog/posts') return res.end(JSON.stringify({ items: [post], total: 1, pages: 1, page: 1 }));
    if (url.pathname === '/api/blog/posts/' + post.slug) return res.end(JSON.stringify(post));
    res.statusCode = url.pathname.includes('/admin/') ? 401 : 404; res.end('{}');
  }); await new Promise(resolve => fixture.listen(3099, '127.0.0.1', resolve));
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3026'], { env: { ...process.env, BACKEND_API_URL: 'http://127.0.0.1:3099/api' }, stdio: 'pipe', windowsHide: true });
  let logs = ''; app.stdout.on('data', d => logs += d); app.stderr.on('data', d => logs += d);
  for (let i = 0; i < 60; i++) { try { if ((await fetch(root)).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); if (i === 59) throw Error(logs); }
  const manifestResponse = await fetch(root + '/search-manifest.json');
  assert.match(manifestResponse.headers.get('x-robots-tag'), /noindex/);
  const manifest = await manifestResponse.json();
  const index = await (await fetch(root + '/sitemap.xml')).text(); assert.match(index, /<sitemapindex/);
  const pagesXml = await (await fetch(root + '/sitemaps/pages.xml')).text();
  const blogXml = await (await fetch(root + '/sitemaps/blog-1.xml')).text();
  assert.ok(blogXml.includes('<lastmod>' + post.seoUpdatedAt + '</lastmod>')); assert.ok(!pagesXml.includes('<lastmod>'));
  assert.ok(!pagesXml.includes('tiktok-setup')); assert.ok(!pagesXml.includes('video-ad-scripts'));
  for (const { path, fingerprint } of manifest.pages) {
    assert.match(fingerprint, /^[a-f0-9]{64}$/); assert.ok(pagesXml.includes(origin + path + '</loc>'));
  }
  for (const path of [...manifest.pages.map(p => p.path), '/blog/' + post.slug]) {
    const res = await fetch(root + path), html = await res.text();
    assert.equal(res.status, 200, path);
    const canonicals = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/g)]; assert.equal(canonicals.length, 1, path + ' canonical count'); assert.ok(canonicals[0][0].includes(origin + path + '"'), path);
    for (const field of ['description', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:title', 'twitter:description']) assert.ok(html.includes('"' + field + '"'), path + ' ' + field);
    assert.ok(html.includes('index,follow,max-image-preview:large'), path);
    const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]; assert.equal(scripts.length, 1, path);
    const data = JSON.parse(scripts[0][1]); assert.equal(data['@context'], 'https://schema.org');
    assert.ok(data['@graph'].some(n => n['@type'] === 'Organization')); assert.ok(!scripts[0][1].includes('aggregateRating')); assert.ok(!scripts[0][1].includes('datePublished'));
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, path + ' H1 count');
    report.push({ path, status: res.status, canonical: origin + path, schema: data['@graph'].map(n => n['@type']), indexable: true });
  }
  for (const path of ['/tiktok-setup', '/start', '/growth-assessment', '/pickadate', '/payment-success', '/pay-invoice/local-test', '/invoice-generator', '/ads-calculator', '/crm-inbox', '/crm-login', '/crm-dashboard', '/crm-ads-dashboard', '/crm-verification-dashboard', '/admin-login-0tT6Yc1', '/admin-7812er', '/admin-7812er/blog']) {
    const res = await fetch(root + path), html = await res.text();
    assert.match(res.headers.get('x-robots-tag') || '', /noindex/, path);
    assert.match(html, /name="robots"[^>]*content="noindex/, path);
    assert.ok(!pagesXml.includes(origin + path + '</loc>'));
    report.push({ path, status: res.status, indexable: false });
  }
  const duplicate = await (await fetch(root + '/services/video-ad-scripts')).text(); assert.ok(duplicate.includes('href="' + origin + '/video-script"'));
  assert.equal((await fetch(root + '/services/not-a-real-service')).status, 404); assert.equal((await fetch(root + '/blog/draft-or-missing')).status, 404);
  const preview = await fetch(root + '/course?preview=paid'); assert.match(preview.headers.get('x-robots-tag'), /noindex/);
  const robots = await (await fetch(root + '/robots.txt')).text(); assert.ok(robots.replace(/\r/g, '').includes('User-agent: GPTBot\nDisallow: /')); assert.ok(robots.includes(origin + '/sitemap.xml')); assert.ok(!robots.includes('Disallow: /_next'));
  const key = JSON.parse(fs.readFileSync('../backend/search/config.json')).key; assert.equal(await (await fetch(root + '/' + key + '.txt')).text(), key);
  unavailable = true; assert.equal((await fetch(root + '/blog')).status, 503); assert.equal((await fetch(root + '/sitemap.xml')).status, 503); assert.equal((await fetch(root + '/sitemaps/pages.xml')).status, 200); unavailable = false;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => { const url = new URL(route.request().url()); return url.hostname === 'localhost' && !url.pathname.startsWith('/api/') ? route.continue() : route.fulfill({ status: 200, body: '{}', contentType: 'application/json' }); });
  fs.mkdirSync('artifacts/seo', { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(root + '/services'); await page.getByRole('heading', { name: 'Advertising support, your way.' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `artifacts/seo/services-${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []); fs.writeFileSync('artifacts/seo/route-checks.json', JSON.stringify(report, null, 2));
  console.log(`PASS: ${report.length} route checks; SSR metadata, JSON-LD, canonical, sitemap, robots, key, failures, responsive layout. No external submissions.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (app) app.kill(); if (fixture) await new Promise(r => fixture.close(r)); });
