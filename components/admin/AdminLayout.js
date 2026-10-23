import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import { FiMenu, FiX, FiGrid, FiCalendar, FiUsers, FiBarChart2, FiBookOpen, FiClipboard, FiLogOut, FiArrowUpRight, FiMessageSquare, FiCreditCard, FiChevronDown, FiCpu, FiSettings } from "react-icons/fi";
import styles from "../../styles/AdminShell.module.css";
import RecordDeletion from "./RecordDeletion";

export const adminPages = [
  ["general-settings", "General settings", FiGrid, "Manage payment preferences for your course pages."],
  ["blog", "Blog", FiBookOpen, "Write, shape and publish ideas from Joshspot Media."],
  ["overview", "Overview", FiGrid, "Your business at a glance."],
  ["ai-agent", "AI Agent", FiBookOpen, "Configure your assistant, knowledge, sales flows and human handoff."],
  ["inbox-contacts", "Inbox contacts", FiUsers, "All your WhatsApp contacts, 20 at a time."],
  ["staff", "Staff management", FiUsers, "Manage staff accounts, roles and permissions."],
  ["earnings", "Staff earnings", FiBarChart2, "Review response times, deductions and monthly statements."],
  ["quick-replies", "Quick replies", FiClipboard, "Manage the replies your team inserts with a slash."],
  ["courses", "Course payments", FiBookOpen, "Every checkout. Every customer. One clear view."],
  ["sources", "Sources that convert", FiBarChart2, "See which tracking links bring in course purchases."],
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
        const items = menu.current && [...menu.current.querySelectorAll("a, button, summary")].filter(el=>el.getClientRects().length);
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
    <nav aria-label="Admin navigation">{[
      {key:'overview',label:'Overview',icon:FiGrid,href:adminHref('overview')},
      {label:'Chatbot inbox',icon:FiMessageSquare,children:[['inbox','Open inbox','/crm-inbox',FiMessageSquare],['quick-replies','Quick replies',adminHref('quick-replies'),FiClipboard],['inbox-contacts','Inbox contacts',adminHref('inbox-contacts'),FiUsers]]},
      {label:'AI settings',icon:FiCpu,children:[['ai-agent','AI agents',adminHref('ai-agent'),FiCpu],['ai-settings','AI settings',adminHref('ai-agent')+'?view=settings',FiSettings],['ai-knowledge-base','Knowledge base',adminHref('ai-agent')+'?view=knowledge',FiBookOpen]]},
      {label:'Staff',icon:FiUsers,children:[['staff','Staff management',adminHref('staff'),FiUsers],['earnings','Staff earnings',adminHref('earnings'),FiBarChart2]]},
      {key:'invoices',label:'Paid invoices',icon:FiCreditCard,href:adminHref('invoices')},
      {label:'Course',icon:FiBookOpen,children:[['courses','Course payments',adminHref('courses'),FiCreditCard],['sources','Sources that convert',adminHref('sources'),FiBarChart2],['mytiklink','Visit Mytiklink','https://mytiklink.com/admin/users',FiArrowUpRight,true],['course-page','View course page','/course',FiArrowUpRight,true],['whatsapp-page','WhatsApp course page','/whatsapp',FiArrowUpRight,true]]},
      {label:'Customers & planning',icon:FiCalendar,children:[['bookings','Bookings',adminHref('bookings'),FiClipboard],['schedule','Schedule',adminHref('schedule'),FiCalendar],['leads','Growth leads',adminHref('leads'),FiUsers],['performance','Service performance',adminHref('performance'),FiBarChart2]]},
      {label:'CRM dashboard',icon:FiGrid,children:[['setup-clients','Setup clients','/crm-dashboard',FiUsers],['ads-clients','Ads clients','/crm-ads-dashboard',FiBarChart2],['verification-clients','Verification clients','/crm-verification-dashboard',FiClipboard]]},
      {label:'Websites',icon:FiBookOpen,children:[['blog','Blog',adminHref('blog'),FiBookOpen]]},
      {key:'general-settings',label:'General settings',icon:FiSettings,href:adminHref('general-settings')}
    ].map(item=>{
      const current=active==='ai-agent'?(router.query.view==='settings'?'ai-settings':router.query.view==='knowledge'?'ai-knowledge-base':'ai-agent'):active;
      const navLink=(key,label,href,Icon,external=false)=><Link key={key} href={demo&&!external?href+(href.includes('?')?'&':'?')+'preview=demo':href} target={external?'_blank':undefined} rel={external?'noopener noreferrer':undefined} aria-current={current===key?'page':undefined} className={current===key?styles.active:''} onClick={()=>setOpen(false)}><Icon/>{label}</Link>;
      if(!item.children)return navLink(item.key,item.label,item.href,item.icon);
      const selected=item.children.some(([key])=>key===current);
      return <details className={`${styles.navGroup} ${selected?styles.currentGroup:''}`} key={item.label} open={selected||undefined}><summary><span className={styles.groupIcon}><item.icon/></span><span>{item.label}</span><FiChevronDown className={styles.groupChevron}/></summary>{item.children.map(args=>navLink(...args))}</details>;
    })}</nav>
    <div className={styles.sidebarBottom}>
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
