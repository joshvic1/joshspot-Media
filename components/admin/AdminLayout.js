import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import { FiMenu, FiX, FiGrid, FiCalendar, FiUsers, FiBarChart2, FiBookOpen, FiClipboard, FiLogOut, FiArrowUpRight } from "react-icons/fi";
import styles from "../../styles/AdminShell.module.css";
import RecordDeletion from "./RecordDeletion";

export const adminPages = [
  ["overview", "Overview", FiGrid, "Your business at a glance."],
  ["courses", "Course payments", FiBookOpen, "Every checkout. Every customer. One clear view."],
  ["invoices", "Paid invoices", FiClipboard, "Confirmed invoice payments, customer details and revenue."],
  ["bookings", "Bookings", FiClipboard, "Manage client bookings and service details."],
  ["schedule", "Schedule", FiCalendar, "Plan your day and keep work moving."],
  ["leads", "Growth leads", FiUsers, "Turn promising conversations into your next clients."],
  ["performance", "Service performance", FiBarChart2, "See which services bring in business."],
];
export const adminHref = (key) => key === "overview" ? "/admin-7812er" : `/admin-7812er/${key}`;
const subscribeSession = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};
const hasAdminSession = () => Boolean(localStorage.getItem("adminToken"));
const serverSession = () => false;

export default function AdminLayout({ active, children }) {
  const router = useRouter();
  const demo = process.env.NODE_ENV === "development" && router.query.preview === "demo";
  const authorized = useSyncExternalStore(subscribeSession, hasAdminSession, serverSession);
  const [open, setOpen] = useState(false);
  const menu = useRef(null);
  const toggle = useRef(null);
  const page = adminPages.find(([key]) => key === active) || adminPages[0];
  useEffect(() => {
    if (!router.isReady) return;
    if (!demo && !hasAdminSession()) router.replace("/admin-login-0tT6Yc1");
  }, [router.isReady, demo, router, authorized]);
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menu.current?.querySelector("button")?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (event.key === "Tab") {
        const items = menu.current?.querySelectorAll("a, button");
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = prior; document.removeEventListener("keydown", handleKey); };
  }, [open]);
  const navigation = (mobile = false) => <>
    <div className={styles.brand}><span>j.</span><div>Joshspot Media<small>BUSINESS WORKSPACE</small></div>
      {mobile && <button className={styles.close} aria-label="Close menu" onClick={() => { setOpen(false); toggle.current?.focus(); }}><FiX /></button>}
    </div>
    <div className={styles.navLabel}>WORKSPACE</div>
    <nav aria-label="Admin navigation">{adminPages.map(([key, title, Icon]) => (
      <Link key={key} href={`${adminHref(key)}${demo ? "?preview=demo" : ""}`} aria-current={active === key ? "page" : undefined}
        className={active === key ? styles.active : ""} onClick={() => setOpen(false)}><Icon />{title}</Link>
    ))}<Link href="/crm-dashboard" onClick={() => setOpen(false)}><FiUsers />CRM dashboard</Link></nav>
    <div className={styles.sidebarBottom}>
      <a href="/course" target="_blank" rel="noopener noreferrer"><FiArrowUpRight /> View course page</a>
      <a href="/whatsapp" target="_blank" rel="noopener noreferrer"><FiArrowUpRight /> WhatsApp course page</a>
      <button onClick={() => { localStorage.removeItem("adminToken"); router.push("/admin-login-0tT6Yc1"); }}><FiLogOut /> Sign out</button>
      <div className={styles.profile}><span>J</span><div>Josh<small>Administrator</small></div></div>
    </div>
  </>;
  return <RecordDeletion><div className={styles.shell}>
    <Head><title>{`${page[1]} · Joshspot Admin`}</title><meta name="robots" content="noindex,nofollow" /></Head>
    <aside className={styles.desktopSidebar}>{navigation()}</aside>
    {open && <div className={styles.overlay} onClick={() => { setOpen(false); toggle.current?.focus(); }}>
      <aside ref={menu} className={styles.mobileSidebar} role="dialog" aria-modal="true" aria-label="Admin menu" onClick={(event) => event.stopPropagation()}>{navigation(true)}</aside>
    </div>}
    <div className={styles.workspace}>
      <header className={styles.topbar}>
        <div><button ref={toggle} className={styles.menuButton} aria-label="Open navigation menu" aria-expanded={open} onClick={() => setOpen(true)}><FiMenu /></button>
          <span>Workspace <b>/</b> {page[1]}</span></div>
        <span className={styles.adminBadge}>Admin workspace <i /></span>
      </header>
      <main className={styles.content}>
        <div className={styles.pageHeader}><div><span className={styles.eyebrow}>JOSHSPOT CRM</span><h1>{page[1]}</h1><p>{page[3]}</p></div><span className={styles.headerMark}>{String(adminPages.indexOf(page) + 1).padStart(2, "0")}</span></div>
        {demo && <p className={styles.demoBanner}>Design preview · Sample data only. No customer records are loaded and no emails are sent.</p>}
        {router.isReady && (authorized || demo) ? children : <p role="status">Checking your session…</p>}
      </main>
    </div>
  </div></RecordDeletion>;
}
