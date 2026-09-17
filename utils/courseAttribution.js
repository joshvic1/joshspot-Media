const sources = ['tiktok','instagram','facebook','whatsapp','google','snapchat','youtube','direct','other','unknown'];
function sourceFromHost(host) {
  const matches = domain => host === domain || host.endsWith('.' + domain);
  if (matches('tiktok.com')) return 'tiktok';
  if (matches('instagram.com')) return 'instagram';
  if (matches('facebook.com') || matches('fb.com')) return 'facebook';
  if (matches('whatsapp.com') || matches('wa.me')) return 'whatsapp';
  if (matches('snapchat.com')) return 'snapchat';
  if (matches('youtube.com') || matches('youtu.be')) return 'youtube';
  if (matches('google.com')) return 'google';
  return 'other';
}
function detectBrowser(ua = '') {
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  if (/TikTok|musical_ly|BytedanceWebview|aweme/i.test(ua)) return 'tiktok';
  if (/WhatsApp/i.test(ua)) return 'whatsapp';
  if (/Snapchat/i.test(ua)) return 'snapchat';
  if (/Edg\/|EdgA\/|EdgiOS\//i.test(ua)) return 'edge';
  if (/OPR\/|Opera|OPiOS/i.test(ua)) return 'opera';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Firefox\/|FxiOS\//i.test(ua)) return 'firefox';
  if (/; wv\)|\bwv\b/i.test(ua)) return 'in-app';
  if (/Chrome\/|CriOS\//i.test(ua)) return 'chrome';
  if (/Safari\//i.test(ua) && /Version\//i.test(ua)) return 'safari';
  return 'unknown';
}
function deriveSource(href, referrer = '') {
  const url = new URL(href);
  const sourceLabel = (url.searchParams.get('utm_source') || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
  const tag = sourceLabel.toLowerCase();
  const aliases = {ig:'instagram',fb:'facebook',tt:'tiktok',wa:'whatsapp',snap:'snapchat'};
  if (tag) {
    const platform = tag.match(/^(tiktok|instagram|facebook|whatsapp|google|snapchat|youtube|snap|ig|fb|tt|wa)(?=$|[\s_\-\d])/i)?.[1];
    const source = aliases[platform] || platform || (sources.includes(tag) ? tag : 'other');
    return {source, sourceLabel, method:'tag'};
  }
  if (url.searchParams.has('ttclid')) return {source:'tiktok',method:'click-id'};
  if (url.searchParams.has('ScCid')) return {source:'snapchat',method:'click-id'};
  if (url.searchParams.has('gclid')) return {source:'google',method:'click-id'};
  // fbclid is shared by Facebook and Instagram and cannot distinguish them.
  try { const ref = new URL(referrer); if (ref.hostname !== url.hostname) return {source:sourceFromHost(ref.hostname),method:'referrer'}; } catch {}
  return {source:'direct',method:'none'};
}
function captureCourseAttribution() {
  if (typeof window === 'undefined') return;
  const current = deriveSource(window.location.href, document.referrer);
  const now = Date.now();
  try {
    const saved = JSON.parse(sessionStorage.getItem('course-attribution') || 'null');
    if (current.method === 'none' && saved && now - saved.at < 30 * 60 * 1000) return saved;
    const next = {...current,at:now}; sessionStorage.setItem('course-attribution',JSON.stringify(next)); return next;
  } catch { return {...current,at:now}; }
}
module.exports = { detectBrowser, deriveSource, captureCourseAttribution };
