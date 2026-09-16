export const COURSE_PIXEL_ID = "1748244569523969";
export const COURSE_TIKTOK_PIXEL_ID = "D8PHSLRC77UCDHMP5VU0";
const tiktokSent = new Set();
function courseTikTok() {
  if (!courseTrackingAllowed()) return null;
  window.TiktokAnalyticsObject = "ttq";
  const ttq = window.ttq = window.ttq || [];
  if (!ttq.load) {
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
    ttq.setAndDefer = (target, method) => { target[method] = (...args) => target.push([method, ...args]); };
    ttq.methods.forEach((method) => ttq.setAndDefer(ttq, method));
    ttq.load = (id, options) => {
      const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = url;
      ttq._t = ttq._t || {}; ttq._t[id] = Date.now();
      ttq._o = ttq._o || {}; ttq._o[id] = options || {};
      const script = document.createElement("script"); script.async = true;
      script.src = `${url}?sdkid=${id}&lib=ttq`; document.head.appendChild(script);
    };
  }
  if (!ttq.instance) ttq.instance = (id) => {
    const instance = ttq._i[id];
    ttq.methods.forEach((method) => { if (!instance[method]) ttq.setAndDefer(instance, method); });
    return instance;
  };
  if (!ttq._i?.[COURSE_TIKTOK_PIXEL_ID]) ttq.load(COURSE_TIKTOK_PIXEL_ID);
  return ttq.instance(COURSE_TIKTOK_PIXEL_ID);
}

function trackTikTokCourse(event, data, once) {
  try {
    // Account creation is already represented by SubmitForm; do not count it twice.
    if (event === "CoursePaymentAccountCreated" || (once && tiktokSent.has(once))) return;
    const pixel = courseTikTok(); if (!pixel) return;
    if (event === "PageView") pixel.page();
    else pixel.track(event === "Lead" ? "SubmitForm" : event, { content_ids: ["ads-course"], content_type: "product", description: "TikTok, Facebook & Instagram Ads Course", currency: "NGN", ...data });
    if (once) tiktokSent.add(once);
  } catch { /* Tracking must not interrupt checkout. */ }
}

async function trackTikTokPurchase(invoice) {
  try {
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(invoice.token));
    const eventId = `course-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    const key = `tiktok-${COURSE_TIKTOK_PIXEL_ID}-${eventId}`;
    if (tiktokSent.has(key)) return;
    try { if (window.localStorage.getItem(key)) return; } catch { /* In-memory fallback. */ }
    const pixel = courseTikTok(); if (!pixel) return;
    pixel.track("Purchase", { content_ids: ["ads-course"], content_type: "product", currency: "NGN", value: Number(invoice.amount), quantity: 1 }, { event_id: eventId });
    tiktokSent.add(key);
    try { window.localStorage.setItem(key, "1"); } catch { /* In-memory fallback. */ }
  } catch { /* Tracking must not interrupt paid access. */ }
}
export const COURSE_SNAP_PIXEL_ID = "99f1a8b1-e67c-475a-a919-939396d44dd7";
const snapSent = new Set();
const snapEvents = {
  PageView: "PAGE_VIEW", ViewContent: "VIEW_CONTENT", InitiateCheckout: "START_CHECKOUT",
  CoursePaymentAccountCreated: "CUSTOM_EVENT_1", CourseLinksEmailed: "CUSTOM_EVENT_2",
  CourseTelegramClick: "CUSTOM_EVENT_3", CourseQuestionAnswered: "CUSTOM_EVENT_4",
  CoursePaymentDetailsCopied: "CUSTOM_EVENT_5",
};

function initializeSnap() {
  if (!courseTrackingAllowed()) return false;
  if (!window.snaptr) {
    const snaptr = function (...args) { if (snaptr.handleRequest) snaptr.handleRequest(...args); else snaptr.queue.push(args); };
    snaptr.queue = [];
    window.snaptr = snaptr;
    const script = document.createElement("script");
    script.async = true; script.src = "https://sc-static.net/scevent.min.js";
    document.head.appendChild(script);
  }
  if (!window.__courseSnapInitialized) {
    window.snaptr("init", COURSE_SNAP_PIXEL_ID, {});
    window.__courseSnapInitialized = true;
  }
  return true;
}

function trackSnapCourse(event, data, once) {
  try {
    if (!snapEvents[event] || !initializeSnap() || (once && snapSent.has(once))) return;
    const params = { item_ids: ["ads-course"], currency: "NGN" };
    if (Number(data.value) > 0) params.price = Number(data.value);
    window.snaptr("track", snapEvents[event], params);
    if (once) snapSent.add(once);
  } catch { /* Keep Snap independent of checkout and Meta. */ }
}

async function trackSnapPurchase(invoice) {
  try {
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(invoice.token));
    const transactionId = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const key = `snap-${COURSE_SNAP_PIXEL_ID}-${transactionId}`;
    if (snapSent.has(key)) return;
    try { if (window.localStorage.getItem(key)) return; } catch { /* In-memory fallback. */ }
    if (!initializeSnap()) return;
    window.snaptr("track", "PURCHASE", { item_ids: ["ads-course"], currency: "NGN", price: Number(invoice.amount), transaction_id: transactionId });
    snapSent.add(key);
    try { window.localStorage.setItem(key, "1"); } catch { /* In-memory fallback. */ }
  } catch { /* Tracking must not interrupt course access. */ }
}
const sent = new Set();
const product = { content_ids: ["ads-course"], content_type: "product", content_name: "TikTok, Facebook & Instagram Ads Course", currency: "NGN" };

export function courseTrackingAllowed() {
  return typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/course" &&
    !new URLSearchParams(window.location.search).has("preview") &&
    !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

function initialize() {
  if (!courseTrackingAllowed()) return false;
  if (!window.fbq) {
    const fbq = function (...args) { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue.push(args); };
    fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0"; fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    const script = document.createElement("script");
    script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  if (!window.__courseMetaInitialized) {
    // Disable inferred button events and automatic matching; send only explicit course events.
    window.fbq("set", "autoConfig", false, COURSE_PIXEL_ID);
    window.fbq("init", COURSE_PIXEL_ID);
    window.__courseMetaInitialized = true;
  }
  return true;
}

export function trackCourse(event, data = {}, { custom = false, once } = {}) {
  trackTikTokCourse(event, data, once);
  trackSnapCourse(event, data, once);
  try {
    if (!initialize() || (once && sent.has(once))) return;
    window.fbq(custom ? "trackSingleCustom" : "trackSingle", COURSE_PIXEL_ID, event, { ...product, ...data });
    if (once) sent.add(once);
  } catch { /* Analytics must never interrupt checkout. */ }
}

export async function trackCoursePurchase(invoice) {
  if (!courseTrackingAllowed() || invoice?.preview || invoice?.status !== "paid" || !invoice.token || !(Number(invoice.amount) > 0)) return;
  await trackSnapPurchase(invoice);
  await trackTikTokPurchase(invoice);
  try {
    // Hash the access token so no course-access credential leaves the application.
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(invoice.token));
    const eventID = `course-purchase-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    if (sent.has(eventID)) return;
    try { if (window.localStorage.getItem(eventID)) return; } catch { /* Session deduplication still applies. */ }
    if (!initialize()) return;
    window.fbq("trackSingle", COURSE_PIXEL_ID, "Purchase", { ...product, value: Number(invoice.amount), num_items: 1 }, { eventID });
    sent.add(eventID);
    try { window.localStorage.setItem(eventID, "1"); } catch { /* Storage may be unavailable. */ }
  } catch { /* Analytics must never interrupt paid access. */ }
}
