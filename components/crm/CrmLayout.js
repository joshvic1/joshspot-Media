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
    const resize = () => {
      shell.current?.style.setProperty(
        "--inbox-viewport-height",
        `${Math.round(viewport?.height || window.innerHeight)}px`,
      );
      if (shell.current)
        shell.current.dataset.keyboardOpen = String(
          window.innerHeight - (viewport?.height || window.innerHeight) > 150,
        );
    };
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
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
