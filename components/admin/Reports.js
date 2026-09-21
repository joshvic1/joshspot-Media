import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiRefreshCw } from "react-icons/fi";
import { FaWhatsapp, FaTiktok } from "react-icons/fa";
import Pagination, { pageRows } from "./Pagination";
import { DeleteButton } from "./RecordDeletion";
import styles from "../../styles/AdminReports.module.css";
const money = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;
const date = (value) => value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }) : "Date not available";
function range(preset) {
  const now = new Date(), today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
  if (preset === "all" || preset === "custom") return { from: "", to: "" };
  const from = new Date(`${today}T12:00:00+01:00`);
  if (preset === "7") from.setUTCDate(from.getUTCDate() - 6);
  if (preset === "30") from.setUTCDate(from.getUTCDate() - 29);
  if (preset === "month") from.setUTCDate(1);
  return { from: from.toISOString().slice(0,10), to: today };
}
function demoReport(mode, query) {
  const all = Array.from({ length: 36 }, (_, index) => {
    const source = index % 3 === 0 ? "bookings" : "invoices";
    return { id: `sample-report-${index}`, kind: source, source, name: ["Ada Okafor", "Tunde Bakare", "Zainab Musa"][index % 3],
      email: index % 4 ? "sample@example.com" : "", phone: "+2348000000000", reference: `sample-payment-${index + 1}`,
      service: source === "bookings" ? "Ads management" : index % 4 === 2 ? "WhatsApp Status ads course" : index % 2 ? "Ads course" : "Video script",
      amount: source === "bookings" ? 50000 : index % 4 === 2 ? 10000 : index % 2 ? 8000 : 15000,
      paidAt: new Date(Date.now() - index * 86400000).toISOString(), note: "Sample confirmed payment" };
  }).filter((row) => mode !== "invoices" || row.source === "invoices");
  const rows = all.filter((row) => (!query.from || new Date(row.paidAt) >= new Date(`${query.from}T00:00:00+01:00`)) &&
    (!query.to || new Date(row.paidAt) <= new Date(`${query.to}T23:59:59.999+01:00`)) &&
    (query.service === "all" || row.service === query.service) && (query.source === "all" || row.source === query.source) &&
    (!query.min || row.amount >= Number(query.min)) && (!query.max || row.amount <= Number(query.max)) &&
    [row.name,row.email,row.phone,row.reference].join(" ").toLowerCase().includes(query.search.toLowerCase()));
  const result = pageRows(rows, query.page, query.pageSize);
  const breakdown = {};
  rows.forEach((row) => { breakdown[row.service] ||= { service: row.service, count: 0, revenue: 0 }; breakdown[row.service].count++; breakdown[row.service].revenue += row.amount; });
  const invoiceRevenue = rows.filter((row) => row.source === "invoices").reduce((sum,row) => sum + row.amount, 0);
  return { records: result.rows, total: rows.length, page: result.page, pages: result.pages, revenue: rows.reduce((sum,row) => sum + row.amount, 0),
    payments: rows.length, invoiceRevenue, bookingRevenue: rows.reduce((sum,row) => sum + row.amount, 0) - invoiceRevenue,
    courseRevenue: rows.filter((row) => ["Ads course", "WhatsApp Status ads course"].includes(row.service)).reduce((sum,row) => sum + row.amount, 0),
    bookings: 24, completed: 8, leads: 24, highPriority: 12, unverifiedBookings: 0, unknownDates: 0,
    services: [...new Set(all.map((row) => row.service))], breakdown: Object.values(breakdown),
    recent: { records: result.rows, total: rows.length, page: result.page, pages: result.pages } };
}
export default function Reports({ mode = "overview" }) {
  const router = useRouter(), invoicesOnly = mode === "invoices";
  const demo = process.env.NODE_ENV === "development" && router.query.preview === "demo";
  const [query, setQuery] = useState({ preset:"all", from:"", to:"", source:"all", service:"all", min:"", max:"", search:"", page:1, pageSize:20 });
  const [data, setData] = useState(null), [error, setError] = useState(""), [notice, setNotice] = useState(""), [loading, setLoading] = useState(true), [syncing, setSyncing] = useState(false), [refresh, setRefresh] = useState(0);
  const [breakdownPage,setBreakdownPage] = useState(1);
  const update = (key, value) => setQuery((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));
  const reload = () => setRefresh((value) => value + 1);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        if ((query.from && query.to && query.from > query.to) || (query.min && query.max && Number(query.min) > Number(query.max))) throw new Error("The start of a range must not be greater than its end.");
        if (demo) { setData(demoReport(mode, query)); return; }
        const response = await fetch(`/api/admin/${invoicesOnly ? "paid-invoices" : "overview"}?${new URLSearchParams(query)}`, {
          headers: { authorization: localStorage.getItem("adminToken") || "" }, signal: controller.signal,
        });
        if (response.status === 401) { router.push("/admin-login-0tT6Yc1"); return; }
        const result = await response.json(); if (!response.ok) throw new Error(result.message || "Unable to load report."); setData(result);
      } catch (error) { if (!controller.signal.aborted) { setError(error.message); setData(null); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [demo, invoicesOnly, mode, query, refresh, router]);
  const sync = async () => {
    setSyncing(true); setNotice("");
    try {
      if (demo) { setNotice("Preview only. No Paystack records were changed."); return; }
      const response = await fetch("/api/admin/sync-payments", { method:"POST", headers:{ authorization:localStorage.getItem("adminToken") || "" } });
      const result = await response.json(); if (!response.ok) throw new Error(result.message); setNotice(result.message); reload();
    } catch (error) { setNotice(error.message || "Unable to sync payments."); } finally { setSyncing(false); }
  };
  const payments = invoicesOnly ? data : data?.recent;
  const breakdown = pageRows(data?.breakdown || [], breakdownPage, 10);
  const metrics = invoicesOnly ? [["Total invoice revenue", data?.revenue, true], ["Successful invoices", data?.total], ["Average invoice", data?.total ? data.revenue / data.total : 0, true]] : [
    ["Total confirmed revenue", data?.revenue, true], ["Paid bookings revenue", data?.bookingRevenue, true], ["Paid invoices revenue", data?.invoiceRevenue, true],
    ["Course revenue · included above", data?.courseRevenue, true], ["Successful payments", data?.payments], ["Bookings created", data?.bookings],
    ["Services completed", data?.completed], ["Growth leads", data?.leads], ["High-priority leads", data?.highPriority],
  ];
  return <>
    <section className={styles.filterPanel} aria-label="Report filters">
      <div className={styles.tools}><label>Period<select value={query.preset} onChange={(event) => setQuery((current) => ({ ...current, preset:event.target.value, ...range(event.target.value), page:1 }))}>
        <option value="all">All time</option><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="month">This month</option><option value="custom">Custom dates</option></select></label>
        <label>From<input type="date" value={query.from} onChange={(event) => setQuery((current) => ({ ...current, preset:"custom", from:event.target.value, page:1 }))} /></label>
        <label>To<input type="date" value={query.to} onChange={(event) => setQuery((current) => ({ ...current, preset:"custom", to:event.target.value, page:1 }))} /></label>
        {!invoicesOnly && <label>Payment source<select value={query.source} onChange={(event) => update("source",event.target.value)}><option value="all">All sources</option><option value="bookings">Service bookings</option><option value="invoices">Invoices</option></select></label>}
        <label>Service<select value={query.service} onChange={(event) => update("service",event.target.value)}><option value="all">All services</option>{(data?.services || []).map((service) => <option key={service}>{service}</option>)}</select></label>
        <button disabled={loading} onClick={reload}><FiRefreshCw /> Refresh</button><button disabled={syncing} onClick={sync}>{syncing ? "Checking Paystack…" : "Sync Paystack"}</button>
      </div>
      <div className={styles.tools}><label className={styles.grow}>Search payments<input placeholder="Name, email, number or payment reference" value={query.search} onChange={(event) => update("search",event.target.value)} /></label>
        <label>Minimum amount (₦)<input type="number" min="0" value={query.min} onChange={(event) => update("min",event.target.value)} /></label>
        <label>Maximum amount (₦)<input type="number" min="0" value={query.max} onChange={(event) => update("max",event.target.value)} /></label>
      </div>
      <p className={styles.hint}>Revenue uses the payment date in Lagos time and includes gross payments before fees or refunds. Totals cover all matching records, not just this page.{!invoicesOnly && " Booking and lead counts use their creation date; lead counts follow the date filter only. Search and amount filters apply to revenue and payment records."}</p>
    </section>
    {notice && <p className={styles.notice} role="status">{notice}</p>}{error && <p className={styles.error} role="alert">{error}</p>}
    {data?.unverifiedBookings > 0 && <p className={styles.notice}>{data.unverifiedBookings} older bookings have an unverified paid flag and are excluded from confirmed revenue. Sync Paystack to verify those with saved references. Missing references must be recovered from Paystack.</p>}
    {data?.unknownDates > 0 && <p className={styles.notice}>Some older payments have no saved payment date. They count in all-time totals, but are excluded from date-filtered totals.</p>}
    <div className={styles.metrics}>{metrics.map(([label,value,currency]) => <article key={label}><span>{label}</span><strong>{loading || value == null ? "—" : currency ? money(Math.round(value)) : value}</strong></article>)}</div>
    {!invoicesOnly && <section className={styles.panel}><h2>Revenue by service</h2><p className={styles.hint}>Each payment contributes once. Course revenue is part of invoice revenue.</p>
      <div className={styles.tableWrap}><table><thead><tr><th>Service</th><th>Successful payments</th><th>Revenue</th><th>Share</th></tr></thead><tbody>
        {breakdown.rows.map((row) => <tr key={row.service}><td><ServiceLabel service={row.service} /></td><td>{row.count}</td><td>{money(row.revenue)}</td><td><div className={styles.share}><span style={{ width:`${data.revenue ? row.revenue/data.revenue*100 : 0}%` }} /></div>{data.revenue ? Math.round(row.revenue/data.revenue*100) : 0}%</td></tr>)}
        {!breakdown.rows.length && <tr><td colSpan={4} className={styles.empty}>{loading ? "Loading totals…" : "No confirmed payments match these filters."}</td></tr>}
      </tbody></table></div><Pagination page={breakdown.page} pages={breakdown.pages} total={data?.breakdown?.length || 0} onPage={setBreakdownPage} />
    </section>}
    {mode !== "performance" && <section className={styles.panel}><h2>{invoicesOnly ? "Confirmed paid invoices" : "Confirmed payment records"}</h2>
      <div className={styles.tableWrap}><table><thead><tr><th>Customer</th><th>Contact details</th><th>Service</th><th>Amount paid</th><th>Date paid</th><th>Reference / details</th><th>Action</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={7} className={styles.empty}>Loading payments…</td></tr> : payments?.records?.length ? payments.records.map((row) => <tr key={`${row.kind}-${row.id}`}>
          <td><strong>{row.name || "Unnamed customer"}</strong><small>{row.source === "bookings" ? "Service booking" : "Invoice"}</small></td>
          <td>{row.email}<small>{row.phone}</small></td><td><ServiceLabel service={row.service} /></td><td className={styles.amount}>{money(row.amount)}</td><td>{date(row.paidAt)}</td>
          <td className={styles.reference}>{row.reference || "—"}{row.note && <small>{row.note}</small>}</td><td><DeleteButton kind={row.kind} id={row.id} label={row.name || "payment"} onChange={reload} /></td>
        </tr>) : <tr><td colSpan={7} className={styles.empty}>No successful payments match your filters.</td></tr>}
      </tbody></table></div>
      <Pagination page={payments?.page || 1} pages={payments?.pages || 1} total={payments?.total || 0} size={query.pageSize} onSize={(value) => update("pageSize",value)} onPage={(value) => update("page",value)} disabled={loading} />
    </section>}
  </>;
}

function ServiceLabel({service}) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:8}}>{service === 'WhatsApp Status ads course' ? <FaWhatsapp aria-label="WhatsApp course" color="#39804a" /> : service === 'Ads course' ? <FaTiktok aria-label="TikTok course" /> : null}{service}</span>;
}
