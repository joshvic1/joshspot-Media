import { FaTiktok, FaInstagram, FaFacebook, FaWhatsapp, FaChrome, FaSafari, FaFirefoxBrowser, FaEdge, FaSnapchatGhost, FaYoutube, FaGoogle, FaOpera } from "react-icons/fa";
import { FiGlobe } from "react-icons/fi";
const icons = { tiktok: FaTiktok, instagram: FaInstagram, facebook: FaFacebook, whatsapp: FaWhatsapp, chrome: FaChrome, safari: FaSafari, firefox: FaFirefoxBrowser, edge: FaEdge, snapchat: FaSnapchatGhost, youtube: FaYoutube, google: FaGoogle, opera: FaOpera };
const labels = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", chrome: "Chrome", safari: "Safari", firefox: "Firefox", edge: "Edge", snapchat: "Snapchat", youtube: "YouTube", google: "Google", opera: "Opera", samsung: "Samsung Internet", "in-app": "Unidentified in-app browser", direct: "Direct / Unknown", other: "Other", unknown: "Unknown" };
export default function AttributionBadges({ attribution }) {
  return <div style={{ display: "grid", gap: 5, marginTop: 8, fontSize: 11, color: "#526579" }}>
    {[["Source", attribution?.source], ["Checkout", attribution?.browser]].map(([kind, value]) => {
      const Icon = icons[value] || FiGlobe;
      const label = kind === "Source" && attribution?.sourceLabel ? attribution.sourceLabel : labels[value] || "Unknown";
      const method = {tag:"Tagged link", referrer:"Referring website", "click-id":"Ad click identifier", none:"No referral evidence"}[attribution?.method] || "Not recorded";
      return <span key={kind} title={kind === "Source" ? method : "Estimated from checkout browser information; not the banking app"} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon aria-hidden="true" style={{ flexShrink: 0 }} /><span style={{ overflowWrap: "anywhere", whiteSpace: "normal" }}>{kind}: {label}</span></span>;
    })}
  </div>;
}
