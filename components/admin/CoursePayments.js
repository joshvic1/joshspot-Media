import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FiArrowDownLeft, FiCheckCircle, FiClock, FiMail, FiRefreshCw, FiSearch, FiShoppingBag, FiX, FiArrowRight } from "react-icons/fi";
import styles from "../../styles/CourseAdmin.module.css";
import { DeleteButton } from "./RecordDeletion";
import AttributionBadges from "./AttributionBadges";

const labels = { paid: "Successful", pending: "Pending", abandoned: "Abandoned", failed: "Unsuccessful" };
const money = (amount) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount || 0);
const date = (value) => value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }) : "";
const samples = [
  ["Ada Okafor", "ada@example.com", "paid"], ["Tunde Bakare", "tunde@example.com", "paid"],
  ["Zainab Musa", "zainab@example.com", "abandoned"], ["Chika Eze", "", "paid"],
  ["David Akin", "david@example.com", "failed"], ["Amaka Obi", "", "abandoned"],
  ["Bola Ade", "bola@example.com", "pending"], ["Emeka Nwosu", "emeka@example.com", "paid"],
].map(([name, email, status], index) => ({ id: `sample-${index}`, name, email, status, phone: `+234800000000${index}`, amount: 8000,
  createdAt: "2026-09-14T08:00:00Z", paidAt: status === "paid" ? "2026-09-14T08:03:00Z" : null,
  reminderSentAt: index === 2 ? "2026-09-13T08:00:00Z" : null, reminderCount: index === 2 ? 1 : 0 }));

export default function CoursePayments() {
  const router = useRouter();
  const demo = process.env.NODE_ENV === "development" && router.query.preview === "demo";
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      if (demo) {
        const records = samples.filter((record) => (filter === "all" || record.status === filter) &&
          [record.name, record.email, record.phone].some((value) => value.toLowerCase().includes(search.toLowerCase().trim())));
        setData({ records, summary: { total: 8, paid: 4, pending: 1, abandoned: 2, failed: 1, revenue: 32000 }, total: records.length, page: 1, pages: 1 });
        setLoading(false); return;
      }
      try {
        const query = new URLSearchParams({ status: filter, search, page: String(page) });
        const response = await fetch(`/api/admin/course-payments?${query}`, {
          headers: { authorization: localStorage.getItem("adminToken") || "" }, signal: controller.signal,
        });
        if (response.status === 401) { router.push("/admin-login-0tT6Yc1"); return; }
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load payments.");
        setData(result);
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [demo, search, filter, page, refresh, router]);

  useEffect(() => { if (selected) dialog.current?.showModal(); }, [selected]);
  const closeReminder = () => { dialog.current?.close(); setSelected(null); };
  const act = async (record, action) => {
    if (busy) return;
    if (action === "resend" && !window.confirm(`Resend the course links email to ${record.email}?`)) return;
    setBusy(record.id); setError(""); setNotice("");
    try {
      if (demo) {
        setNotice(action === "resend" ? "Preview only: no course email was sent." : action === "remind" ? "Preview only: no reminder email was sent." : "Preview only: this is a sample payment record.");
        if (action === "remind") closeReminder();
        return;
      }
      const response = await fetch(`/api/admin/course-payments/${record.id}/${action}`, {
        method: "POST", headers: { authorization: localStorage.getItem("adminToken") || "" },
      });
      if (response.status === 401) { router.push("/admin-login-0tT6Yc1"); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to complete this action.");
      setNotice(action === "resend" ? `Course links email sent to ${record.email}.` : result.message);
      setRefresh((value) => value + 1);
      if (action === "remind") closeReminder();
    } catch (error) { setError(error.message); }
    finally { setBusy(""); }
  };
  const summary = data?.summary;
  const cards = [
    ["Successful payments", summary?.paid, "Confirmed course purchases", FiCheckCircle, "success"],
    ["Course revenue", summary ? money(summary.revenue) : null, "From successful payments only", FiArrowDownLeft, "revenue"],
    ["Abandoned checkouts", summary?.abandoned, "Unpaid for 30 minutes or expired", FiShoppingBag, "abandoned"],
    ["Unsuccessful payments", summary?.failed, "Payments that did not complete", FiClock, "failed"],
  ];
  return <>
    <div className={styles.metrics}>{cards.map(([title, value, caption, Icon, tone]) => (
      <article className={`${styles.metric} ${styles[tone]}`} key={title}><div><span>{title}</span><Icon /></div>
        <strong>{value ?? "—"}</strong><p>{caption}</p></article>
    ))}</div>
    <section className={styles.panel}>
      <div className={styles.panelHeader}><div><h2>Course customers <span>{summary?.total ?? "—"}</span></h2><p>TikTok, Facebook & Instagram ads course</p></div>
        <button className={styles.secondary} onClick={() => setRefresh((value) => value + 1)} disabled={loading}><FiRefreshCw /> Refresh records</button>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.filters} aria-label="Payment status filters">{[["all", "All checkouts"], ...Object.entries(labels)].map(([value, label]) => (
          <button key={value} aria-pressed={filter === value} className={filter === value ? styles.selectedFilter : ""}
            onClick={() => { setFilter(value); setPage(1); }}>{label}<span>{summary?.[value === "all" ? "total" : value] ?? "—"}</span></button>
        ))}</div>
        <label className={styles.search}><FiSearch /><input aria-label="Search customers by name, WhatsApp or email" placeholder="Search name, number or email…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
      </div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.tableWrap} aria-busy={loading}>
        <table><thead><tr><th scope="col">Customer</th><th scope="col">WhatsApp</th><th scope="col">Email address</th><th scope="col">Payment</th><th scope="col">Amount</th><th scope="col">Checkout date</th><th scope="col">Follow-up</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={7} className={styles.empty} role="status">Loading course payments…</td></tr> : error && !data ? <tr><td colSpan={7} className={styles.empty}>Your records could not be loaded. Use Refresh records to try again.</td></tr> : data?.records.length ? data.records.map((record) => (
            <tr key={record.id}>
              <td><div className={styles.customer}><span className={styles.avatar}>{(record.name || "?").split(" ").slice(0,2).map((word) => word[0]).join("")}</span><div><strong>{record.name || "Unnamed customer"}</strong><AttributionBadges attribution={record.attribution} /></div></div></td>
              <td className={styles.phone}>{record.phone}</td>
              <td>{record.email}</td>
              <td><span className={`${styles.badge} ${styles[record.status]}`}><i />{labels[record.status]}</span>
                {record.paidAt && <small className={styles.meta}>Paid {date(record.paidAt)}</small>}
                {record.status !== "paid" && <button className={styles.textButton} disabled={!!busy} onClick={() => act(record, "check")}>Check payment</button>}</td>
              <td className={styles.amount}>{money(record.amount)}</td>
              <td className={styles.date}>{date(record.createdAt)}</td>
              <td>{record.status === "paid" ? <><span className={styles.complete}><FiCheckCircle /> Complete</span>
                <button className={styles.emailButton} disabled={!record.email || !!busy} title={!record.email ? "This customer has no saved email address." : "Resend the original course links email"} onClick={() => act(record, "resend")}><FiMail />{busy === record.id ? "Sending…" : "Resend course email"}</button>
                {!record.email && <small className={styles.meta}>No email provided</small>}
              </> : <>
                <button className={styles.emailButton} disabled={!record.email || !!busy} title={!record.email ? "This customer did not provide an email address." : "Review and send a payment reminder"}
                  onClick={() => { setError(""); setSelected(record); }}><FiMail /> Send email</button>
                {!record.email && <small className={styles.meta}>No email provided</small>}
                {record.reminderSentAt && <small className={styles.meta}>Last sent {date(record.reminderSentAt)} · {record.reminderCount} total</small>}
              </>}<DeleteButton kind="invoices" id={record.id} label={record.name || "course checkout"} onChange={() => setRefresh((value) => value + 1)} /></td>
            </tr>
          )) : <tr><td colSpan={7} className={styles.empty}><FiSearch /><h3>No matching checkouts</h3><p>{search || filter !== "all" ? "Try a different search or payment filter." : "Customer records will appear here when someone starts checkout."}</p></td></tr>}</tbody>
        </table>
      </div>
      <div className={styles.tableFooter}><span>{data?.total ?? 0} matching checkouts · Times in Lagos</span><div>
        <button aria-label="Previous page" disabled={loading || (data?.page || 1) <= 1} onClick={() => setPage((value) => value - 1)}>←</button>
        <span>Page {data?.page || 1} of {data?.pages || 1}</span>
        <button aria-label="Next page" disabled={loading || (data?.page || 1) >= (data?.pages || 1)} onClick={() => setPage((value) => value + 1)}>→</button>
      </div></div>
    </section>
    <p className={styles.footnote}>Recent unpaid checkouts stay pending. After 30 minutes, they appear as abandoned. Missing emails are left blank. Reminders are limited to one per checkout every 24 hours.</p>
    <dialog ref={dialog} className={styles.dialog} onCancel={(event) => { if (busy) event.preventDefault(); else setSelected(null); }} onClose={() => setSelected(null)}>
      {selected && <><div className={styles.dialogHeader}><span className={styles.dialogIcon}><FiMail /></span><button aria-label="Close email preview" disabled={!!busy} onClick={closeReminder}><FiX /></button></div>
        <h2>Send a gentle reminder</h2><p className={styles.recipient}>To: {selected.email}</p>
        <div className={styles.emailPreview}><strong>Still want to learn TikTok, Facebook and Instagram ads?</strong>
          <p>Hi {selected.name || "there"},</p><p>You started signing up for my TikTok, Facebook and Instagram ads course, but your payment has not been completed.</p>
          <p>Were you having a problem making the payment? You can go back to the course page and try again whenever you are ready:</p>
          <p className={styles.retryLink}>Your course page link</p>
          <p>Once your payment is confirmed, you will get access to the course channels immediately.</p>
          <p>If you have already paid, please check your payment status before making another payment.</p><p>See you inside the channels!<br />Josh</p>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.footnote}>Payment status is checked again before sending.</p>
        <div className={styles.dialogActions}><button className={styles.secondary} disabled={!!busy} onClick={closeReminder}>Cancel</button><button className={styles.primary} disabled={!!busy} onClick={() => act(selected, "remind")}>{busy ? "Checking and sending…" : demo ? "Preview send" : "Send reminder"}<FiArrowRight /></button></div>
      </>}
    </dialog>
  </>;
}
