import "../styles/globals.css";
import { Poppins } from "next/font/google";
import { useEffect } from "react";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
export default function App({ Component, pageProps }) {
  useEffect(() => {
    // The course has its own targeted tracking and preview exclusions.
    if (window.location.pathname.replace(/\/$/, "") === "/course") return;
    if (window.ttq?.load) {
      if (!window.ttq._i?.D7V46AJC77UCL5G1KVLG) window.ttq.load("D7V46AJC77UCL5G1KVLG");
      window.ttq.instance("D7V46AJC77UCL5G1KVLG").page();
      return;
    }
    if (window.ttq && window.__ttLoaded) {
      console.log("⚠️ TikTok already initialized");
      return;
    }

    !(function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = (w[t] = w[t] || []);
      ttq.methods = [
        "page",
        "track",
        "identify",
        "instances",
        "debug",
        "on",
        "off",
        "once",
        "ready",
        "alias",
        "group",
        "enableCookie",
        "disableCookie",
        "holdConsent",
        "revokeConsent",
        "grantConsent",
      ];
      ttq.setAndDefer = function (t, e) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (var i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq, ttq.methods[i]);
      }
      ttq.instance = function (id) {
        var instance = ttq._i[id];
        for (var i = 0; i < ttq.methods.length; i++) {
          if (!instance[ttq.methods[i]]) ttq.setAndDefer(instance, ttq.methods[i]);
        }
        return instance;
      };
      ttq.load = function (e, n) {
        var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = i;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        var o = document.createElement("script");
        o.type = "text/javascript";
        o.async = true;
        o.src = i + "?sdkid=" + e + "&lib=" + t;
        var a = document.getElementsByTagName("script")[0];
        a.parentNode.insertBefore(o, a);
      };
      ttq.load("D7V46AJC77UCL5G1KVLG");
      ttq.instance("D7V46AJC77UCL5G1KVLG").page();
    })(window, document, "ttq");
  }, []);
  return (
    <main className={poppins.className}>
      {" "}
      <Component {...pageProps} />{" "}
    </main>
  );
}
