import Head from "next/head";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  FiUsers,
  FiShield,
  FiTrendingUp,
  FiMenu,
  FiX,
  FiLogOut,
  FiGrid,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
import { canAccessCalculator } from "../../utils/calculatorAccess.mjs";
import styles from "../../styles/AdminShell.module.css";
const pages = [
  ["inbox", "/crm-inbox", "Joshspot Inbox", "Customer conversations, together.", FiMessageSquare],
  [
    "setup",
    "/crm-dashboard",
    "Setup clients",
    "Keep client onboarding organised, from first details to delivery.",
    FiUsers,
  ],
  [
    "verification",
    "/crm-verification-dashboard",
    "Verification clients",
    "Manage verification details and documents in one place.",
    FiShield,
  ],
  [
    "ads",
    "/crm-ads-dashboard",
    "Ads clients",
    "Keep campaigns, creative assets and client delivery moving.",
    FiTrendingUp,
  ],
  [
    "invoices",
    "/invoice-generator",
    "Invoice generator",
    "Create payment requests and share a clear payment message with your customers.",
    FiFileText,
  ],
];
const CrmNavigation = createContext(() => {});
export const useCrmNavigation = () => useContext(CrmNavigation);
export default function CrmLayout({
  active,
  staff,
  onLogout,
  children,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef(null),
    toggle = useRef(null);
  const shell = useRef(null);
  useEffect(() => {
    if (!compact) return;
    const viewport = window.visualViewport;
    const body = document.body, html = document.documentElement;
    const scrollY = window.scrollY;
    const before = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow, htmlOverflow: html.style.overflow };
    // Only the Inbox's message/list panes scroll. Prevent iOS focus panning from
    // exposing the document behind the keyboard-sized shell.
    body.style.position = "fixed"; body.style.top = "0px";
    body.style.width = "100%"; body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    let frame;
    const sync = () => {
      frame = null;
      if (!shell.current || (viewport && Math.abs(viewport.scale - 1) > 0.01)) return;
      const height = viewport?.height || window.innerHeight;
      shell.current.style.setProperty("--inbox-viewport-height", `${height}px`);
      shell.current.style.setProperty("--inbox-viewport-top", `${viewport?.offsetTop || 0}px`);
      shell.current.dataset.keyboardOpen = String(window.innerHeight - height > 150);
    };
    const resize = () => { if (frame == null) frame = requestAnimationFrame(sync); };
    sync();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    document.addEventListener("focusin", resize);
    document.addEventListener("focusout", resize);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      document.removeEventListener("focusin", resize);
      document.removeEventListener("focusout", resize);
      body.style.position = before.position; body.style.top = before.top;
      body.style.width = before.width; body.style.overflow = before.overflow;
      html.style.overflow = before.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [compact]);
  const page = pages.find(([key]) => key === active) || pages[0];
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    toggle.current?.focus();
  };
  const navigation = (mobile = false) => (
    <>
      <div className={styles.brand}>
        <span>j.</span>
        <div>
          Joshspot Media<small>TEAM WORKSPACE</small>
        </div>
        {mobile && (
          <button
            className={styles.close}
            type="button"
            aria-label="Close CRM menu"
            onClick={close}
          >
            <FiX />
          </button>
        )}
      </div>
      <div className={styles.navLabel}>CLIENT MANAGEMENT</div>
      <nav aria-label="CRM navigation">
        {pages
          .filter(([key]) => key !== "inbox" || staff?.admin === true || ["ADMIN", "CSS", "SS"].includes(staff?.role))
          .map(([key, href, title, , Icon]) => (
            <Link
              key={key}
              href={href}
              aria-current={active === key ? "page" : undefined}
              className={active === key ? styles.active : ""}
              onClick={close}
            >
              <Icon />
              {title}
            </Link>
          ))}
        {canAccessCalculator(staff) && (
          <Link href="/ads-calculator" onClick={close}>
            <FiGrid />
            Ads Calculator
          </Link>
        )}
        {staff?.admin && (
          <Link href="/admin-7812er" onClick={close}>
            <FiUsers />
            Admin dashboard
          </Link>
        )}
      </nav>
      <div className={styles.sidebarBottom}>
        <button type="button" onClick={onLogout}>
          <FiLogOut />
          Sign out
        </button>
        <div className={styles.profile}>
          <span>{staff?.name?.[0] || "J"}</span>
          <div>
            {staff?.name || "Team member"}
            <small>
              {staff?.role
                ? `${staff.role} · Staff workspace`
                : "Staff workspace"}
            </small>
          </div>
        </div>
      </div>
    </>
  );
  return (
    <div
      ref={shell}
      className={`${styles.shell} ${compact ? styles.immersive : ""}`}
    >
      <Head>
        <title>{`${page[2]} · Joshspot CRM`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <aside className={styles.desktopSidebar}>{navigation()}</aside>
      <dialog
        ref={dialog}
        className={styles.crmDrawer}
        aria-label="CRM menu"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <aside className={styles.mobileSidebar}>{navigation(true)}</aside>
      </dialog>
      <div className={styles.workspace}>
        {!compact && (
          <header className={styles.topbar}>
            <div>
              <button
                ref={toggle}
                type="button"
                className={styles.menuButton}
                aria-label="Open CRM navigation"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <FiMenu />
              </button>
              <span>
                Workspace <b>/</b> {page[2]}
              </span>
            </div>
            <span className={styles.adminBadge}>
              {staff?.admin ? "Admin workspace" : "Staff workspace"} <i />
            </span>
          </header>
        )}
        <main className={compact ? styles.inboxContent : styles.content}>
          {!compact && (
            <div className={styles.pageHeader}>
              <div>
                <span className={styles.eyebrow}>JOSHSPOT CRM</span>
                <h1>{page[2]}</h1>
                <p>{page[3]}</p>
              </div>
              <span className={styles.headerMark}>
                {String(pages.indexOf(page) + 1).padStart(2, "0")}
              </span>
            </div>
          )}
          <CrmNavigation.Provider value={() => setOpen(true)}>
            {children}
          </CrmNavigation.Provider>
        </main>
      </div>
    </div>
  );
}
