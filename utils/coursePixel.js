export const COURSE_PIXEL_ID = "1748244569523969";
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
  try {
    if (!initialize() || (once && sent.has(once))) return;
    window.fbq(custom ? "trackSingleCustom" : "trackSingle", COURSE_PIXEL_ID, event, { ...product, ...data });
    if (once) sent.add(once);
  } catch { /* Analytics must never interrupt checkout. */ }
}

export async function trackCoursePurchase(invoice) {
  if (!courseTrackingAllowed() || invoice?.preview || invoice?.status !== "paid" || !invoice.token || !(Number(invoice.amount) > 0)) return;
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
