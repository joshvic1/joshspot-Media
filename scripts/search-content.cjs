// Build-time fingerprints of public source only; no environment variables or credentials.
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const hash = files => createHash('sha256').update(files.sort().map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n')).digest('hex');
const shared = ['config/services.js', 'config/seo.js', 'components/PublicLayout.js', 'components/HomeHero.js'];
const result = { shared: hash(shared) };
for (const [url, file] of Object.entries({ '/': 'index.js', '/services': 'services/index.js', '/course': 'course.js', '/whatsapp': 'course.js', '/video-script': 'video-script.js', '/privacy-policy': 'privacy-policy.js', '/blog': 'blog/index.js' })) result[url] = hash([...shared, 'pages/' + file]);
// Service pages share the catalogue and template; a catalogue change is meaningful.
const services = fs.readFileSync(path.join(root, 'config/services.js'), 'utf8');
for (const match of services.matchAll(/slug:\s*"([a-z0-9-]+)"/g)) result['/services/' + match[1]] = hash([...shared, 'pages/services/[slug].js']);
fs.writeFileSync(path.join(root, 'config/search-content-hashes.json'), JSON.stringify(result, null, 2) + '\n');
