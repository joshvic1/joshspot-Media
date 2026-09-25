import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { FiRefreshCw } from "react-icons/fi";
import Pagination, { pageRows } from "./Pagination";
import styles from "../../styles/AdminReports.module.css";

const money = value => `₦${Number(value || 0).toLocaleString("en-NG")}`;
const sourceName = value => value === "unknown" ? "Unknown / not recorded" : value === "direct" ? "Direct" : value;
function openCalendar(event) { try { event.currentTarget.showPicker?.(); } catch {} }
export default function SourceAnalytics() {
  const router = useRouter();
  const demo = process.env.NODE_ENV === "development" && router.query.preview === "demo";
  const [filters, setFilters] = useState({course:"all",from:"",to:""});
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("checkouts");
  const selectPeriod = value => {
    setPeriod(value); setPage(1);
    if (value === "custom") return;
    const today = new Intl.DateTimeFormat("en-CA", {timeZone:"Africa/Lagos",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    const offsetDate = days => { const date = new Date(`${today}T12:00:00+01:00`); date.setUTCDate(date.getUTCDate() - days); return date.toISOString().slice(0,10); };
    setFilters(previous => ({...previous,from:value === "all" ? "" : offsetDate(value === "yesterday" ? 1 : value === "week" ? 6 : 0),to:value === "all" ? "" : value === "yesterday" ? offsetDate(1) : today}));
  };
  const [data,setData] = useState(null), [error,setError] = useState(""), [loading,setLoading] = useState(true);
  const [search,setSearch] = useState(""), [page,setPage] = useState(1), [refresh,setRefresh] = useState(0);
  const change = (key,value) => { setFilters(previous => ({...previous,[key]:value})); if (key !== "course") setPeriod("custom"); setPage(1); };
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        if (filters.from && filters.to && filters.from > filters.to) throw new Error("Choose an end date on or after the start date.");
        if (demo) {
          // Preview stays empty rather than presenting fabricated conversion figures.
          setData({rows:[],totals:{checkouts:0,purchases:0,revenue:0,conversion:0}}); return;
        }
        const response = await fetch(`/api/admin/source-analytics?${new URLSearchParams(filters)}`, {headers:{authorization:localStorage.getItem("adminToken") || ""},signal:controller.signal});
        if (response.status === 401) { router.replace("/admin-login-0tT6Yc1"); return; }
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load source analytics.");
        setData(result);
      } catch (error) { if (!controller.signal.aborted) {setError(error.message);setData(null);} }
      finally {if (!controller.signal.aborted) setLoading(false);}
    }
    load(); return () => controller.abort();
  },[filters,refresh,demo,router]);
  const visible = (data?.rows || []).filter(row => sourceName(row.source).toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a,b) => b[sort] - a[sort] || b.checkouts - a.checkouts || a.source.localeCompare(b.source));
  const pagination = pageRows(visible,page,20);
  const totals = data?.totals;
  return <>
    <section className={styles.filterPanel} aria-label="Source analytics filters"><div className={styles.tools}>
      <label>Date range<select value={period} onChange={event => selectPeriod(event.target.value)}><option value="all">All time</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">Last 7 days</option><option value="custom">Custom dates</option></select></label>
      <label>Course<select value={filters.course} onChange={event => change("course",event.target.value)}><option value="all">Both courses</option><option value="ads-course">TikTok, Facebook & Instagram</option><option value="whatsapp-course">WhatsApp Status ads</option></select></label>
      <label>From<input className={styles.datePicker} type="date" value={filters.from} max={filters.to || undefined} onClick={openCalendar} onChange={event => change("from",event.target.value)} /></label>
      <label>To<input className={styles.datePicker} type="date" value={filters.to} min={filters.from || undefined} onClick={openCalendar} onChange={event => change("to",event.target.value)} /></label>
      <label>Rank sources by<select value={sort} onChange={event => {setSort(event.target.value);setPage(1);}}><option value="checkouts">Most checkouts</option><option value="purchases">Most purchases</option><option value="revenue">Highest revenue</option></select></label>
      <button onClick={() => {setFilters({course:"all",from:"",to:""});setPeriod("all");setSort("checkouts");setSearch("");setPage(1);}}>Reset filters</button>
      <button disabled={loading} onClick={() => setRefresh(value => value+1)}><FiRefreshCw />Refresh</button>
    </div><p className={styles.hint}>Dates use checkout creation time in Lagos. Purchases and revenue reflect the current confirmed payment status of those checkouts, even if payment came later. Each checkout is counted once; repeat attempts by a customer count separately.</p></section>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.metrics}>{[["Confirmed revenue",totals && money(totals.revenue)],["Successful purchases",totals?.purchases],["Checkout conversion",totals && `${totals.conversion.toFixed(1)}%`],["Checkout attempts",totals?.checkouts]].map(([label,value]) => <article key={label}><span>{label}</span><strong>{loading || value == null ? "—" : value}</strong></article>)}</div>
    <section className={styles.panel}><h2>Sources for {filters.from && filters.from === filters.to ? filters.from : "the selected period"}</h2><p className={styles.hint}>Ranked by {sort === "checkouts" ? "checkout attempts" : sort === "purchases" ? "successful purchases" : "confirmed gross revenue, before payment fees"}. These counts include people who started checkout, not all page visitors or unique people. Older records without a saved source appear as Unknown / not recorded.</p>
      <div className={styles.tools}><label className={styles.grow}>Find a source<input placeholder="TikTok 1, Instagram, WhatsApp…" value={search} onChange={event => {setSearch(event.target.value);setPage(1);}} /></label></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Source</th><th>Checkouts</th><th>Purchases</th><th>Not completed</th><th>Conversion</th><th>Revenue</th><th>Revenue share</th></tr></thead><tbody>
        {!loading && !error && pagination.rows.map(row => <tr key={row.source}><td><Link href={{pathname:"/admin-7812er/courses",query:{source:row.source,...(demo ? {preview:"demo"} : {})}}} aria-label={`View course payments from ${sourceName(row.source)}`}><strong>{sourceName(row.source)}</strong></Link></td><td>{row.checkouts}</td><td>{row.purchases}</td><td>{row.checkouts-row.purchases}</td><td>{row.conversion.toFixed(1)}%</td><td className={styles.amount}>{money(row.revenue)}</td><td><div className={styles.share}><span style={{width:`${totals.revenue ? row.revenue/totals.revenue*100 : 0}%`}} /></div>{totals.revenue ? (row.revenue/totals.revenue*100).toFixed(1) : "0"}%</td></tr>)}
        {(loading || error || !pagination.rows.length) && <tr><td colSpan={7} className={styles.empty}>{loading ? "Loading source analytics…" : error ? "Analytics could not be loaded. Try Refresh." : "No checkouts match these filters."}</td></tr>}
      </tbody></table></div>
      <Pagination page={pagination.page} pages={pagination.pages} total={visible.length} size={20} onPage={setPage} disabled={loading} />
      <p className={styles.hint}>Source search filters the table only. Summary totals reflect the selected course and date range.</p>
    </section>
  </>;
}
