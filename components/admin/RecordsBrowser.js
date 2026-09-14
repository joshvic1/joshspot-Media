import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiChevronDown, FiRefreshCw, FiSearch } from "react-icons/fi";
import API from "../../utils/api";
import { DeleteButton } from "./RecordDeletion";
import Pagination, { pageRows } from "./Pagination";
import styles from "../../styles/AdminReports.module.css";
const money = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;
const leadFields = [
  ["WhatsApp", "whatsappNumber"], ["Email", "email"], ["Business type", "businessType"], ["Brand details", "brandDescription"], ["Business age", "businessAge"],
  ["Monthly revenue", "monthlyRevenue"], ["Marketing platforms", "marketingPlatforms"], ["Paid ads experience", "paidAdsExperience"],
  ["Monthly ad spend", "monthlyAdSpend"], ["Ad platforms", "adPlatformsUsed"], ["Biggest ads problem", "biggestAdsProblem"],
  ["Marketing goal", "marketingGoal"], ["Growth blocker", "growthBlocker"], ["Attempted solutions", "attemptedSolutions"],
  ["Business ownership", "businessOwnership"], ["Proposed ad budget", "proposedMonthlyAdBudget"], ["Desired help", "desiredHelp"],
  ["Urgency", "urgency"], ["Implementation readiness", "implementationReadiness"], ["Team budget", "teamMonthlyBudget"],
  ["Extra context", "extraContext"], ["Recommendation", "recommendationTitle"], ["Recommendation details", "recommendationMessage"],
];
const sampleNames = ["Ada Okafor", "Tunde Bakare", "Zainab Musa", "Chika Eze"];
const sampleRecords = Array.from({ length: 24 }, (_, index) => ({
  _id: `sample-${index}`, name: sampleNames[index % 4], fullName: sampleNames[index % 4], businessName: ["Ada's Store", "Bright Studio", "Zee Beauty", "Chika Foods"][index % 4],
  score: 85 - index, endpoint: index % 2 ? "QUALIFIED_STRATEGY" : "STRATEGIC_GROWTH_CALL", email: "sample@example.com", phone: "+2348000000000", whatsappNumber: "+2348000000000",
  serviceTitle: index % 2 ? "Ads management" : "Strategy consultation", price: index % 2 ? 50000 : 20000, paid: index % 3 !== 0,
  paymentVerifiedAt: index % 3 !== 0 ? "2026-09-14T08:00:00Z" : null, paidAt: "2026-09-14T08:00:00Z", createdAt: "2026-09-14T08:00:00Z",
  date: "2026-09-15", time: "10am", packageSelected: "Standard", status: "confirmed", monthlyRevenue: "₦500,000 – ₦1,000,000",
  brandDescription: "A growing business looking to reach more customers.", growthBlocker: "Turning ad clicks into consistent sales.", called: false,
}));
export default function RecordsBrowser({ view }) {
  const router = useRouter(), isLead = view === "leads";
  const demo = process.env.NODE_ENV === "development" && router.query.preview === "demo";
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [filter, setFilter] = useState("all"), [page, setPage] = useState(1), [size, setSize] = useState(10), [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (demo) { setRows(sampleRecords); return; }
      const response = await API.get(isLead ? "/growth-assessment" : "/booking/all"); setRows(response.data);
    } catch (error) { setError("Unable to load records. Please try again."); if (error.response?.status === 401) router.push("/admin-login-0tT6Yc1"); }
    finally { setLoading(false); }
  }, [demo, isLead, router]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const update = async (record, action) => {
    setBusy(record._id); setError("");
    try {
      if (demo) { setRows((current) => current.map((row) => row._id === record._id ? { ...row, ...(isLead ? { called: true } : { status: action === "cancel" ? "cancelled" : "completed" }) } : row)); return; }
      await API.put(isLead ? `/growth-assessment/${record._id}/called` : `/booking/${action}/${record._id}`); await load();
    } catch { setError("Unable to update this record. Please try again."); } finally { setBusy(""); }
  };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
  const categories = [...new Set(rows.map((row) => isLead ? row.endpoint : row.serviceTitle).filter(Boolean))].sort();
  const filtered = rows.filter((row) => {
    const text = [row.name, row.fullName, row.businessName, row.email, row.phone, row.whatsappNumber, row.serviceTitle].join(" ").toLowerCase();
    if (!text.includes(search.trim().toLowerCase())) return false;
    if (filter === "all") return true;
    if (filter === "today") return row.date === today;
    if (filter === "upcoming") return row.date >= today;
    if (filter === "past") return row.date < today;
    if (filter === "called") return row.called;
    if (filter === "uncalled") return !row.called;
    if (filter === "paid") return row.paid && row.paymentVerifiedAt;
    if (filter === "unpaid") return !row.paymentVerifiedAt;
    return (isLead ? row.endpoint : row.serviceTitle) === filter;
  });
  const paged = pageRows(filtered, page, size);
  return <section className={styles.panel}>
    <div className={styles.tools}><label className={styles.search}><FiSearch /><input placeholder="Search name, business, phone or email…" aria-label="Search records" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
      <select aria-label="Filter records" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
        <option value="all">All records</option>{isLead ? <><option value="uncalled">Not called</option><option value="called">Called</option></> : <><option value="paid">Payment confirmed</option><option value="unpaid">Payment not verified</option><option value="today">Today&apos;s appointments</option><option value="upcoming">Upcoming appointments</option><option value="past">Past appointments</option></>}
        {categories.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}
      </select><button disabled={loading} onClick={load}><FiRefreshCw /> Refresh</button></div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <p className={styles.empty} role="status">Loading records…</p> : !filtered.length ? <p className={styles.empty}>No records match your filters.</p> : <div className={styles.cards}>
      {paged.rows.map((row) => <details key={`${view}-${row._id}`} className={styles.record}>
        <summary><div><span className={styles.category}>{(isLead ? row.endpoint : row.serviceTitle || "Service booking").replaceAll("_", " ")}</span>
          <h3>{isLead ? row.fullName : row.name}</h3>{isLead ? <p>{row.businessName}</p> : <p>{money(row.price)} · {row.date || "Date not selected"} {row.time || ""}</p>}</div>
          <div className={styles.summaryEnd}>{isLead ? <span className={styles.score}>{row.score}<small>/100</small></span> : <span className={row.paymentVerifiedAt ? styles.paid : styles.pending}>{row.paymentVerifiedAt ? "Payment confirmed" : "Payment not verified"}</span>}<FiChevronDown /></div>
        </summary>
        <div className={styles.recordDetails}>
          <dl>{isLead ? leadFields.map(([label, key]) => <div key={key}><dt>{label}</dt><dd>{Array.isArray(row[key]) ? row[key].join(", ") || "—" : row[key] || "—"}</dd></div>) : [
            ["Email", row.email], ["WhatsApp", row.phone], ["Package", row.packageSelected || row.duration], ["Service status", row.status],
            ["Amount", money(row.price)], ["Ad budget", money(row.adBudget)], ["Service fee", money(row.serviceFee)],
            ["Payment", row.paymentVerifiedAt ? "Confirmed automatically by Paystack" : row.paid ? "Legacy paid flag — Paystack verification required" : "Awaiting Paystack confirmation"],
            ["Date paid", row.paidAt ? new Date(row.paidAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" }) : "Not available"],
            ["Payment reference", row.paymentReference], ["Appointment", `${row.date || "Not selected"} ${row.time || ""}`], ["Notes", row.notes],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>
          <div className={styles.recordActions}>{isLead ? <>
            {row.whatsappNumber && <a href={`https://wa.me/${row.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            <button disabled={!!busy || row.called} onClick={() => update(row, "called")}>{row.called ? "Called" : "Mark called"}</button>
          </> : <>
            <button disabled={!!busy || row.status === "cancelled" || row.status === "completed"} onClick={() => update(row, "cancel")}>Cancel booking</button>
            <button disabled={!!busy || row.status === "completed" || row.status === "cancelled"} onClick={() => update(row, "complete")}>Mark service complete</button>
          </>}<DeleteButton kind={isLead ? "leads" : "bookings"} id={row._id} label={isLead ? row.fullName : row.name} onChange={load} /></div>
        </div>
      </details>)}
    </div>}
    <Pagination page={paged.page} pages={paged.pages} total={filtered.length} size={size} onPage={setPage} onSize={setSize} disabled={loading} />
  </section>;
}
