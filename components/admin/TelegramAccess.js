import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiLink, FiLoader, FiLock, FiPlus, FiRefreshCw, FiSend, FiShield, FiSlash, FiUsers } from "react-icons/fi";
import styles from "../../styles/TelegramAccess.module.css";

const productLabel = (product) => product === "whatsapp-course" ? "WhatsApp Status ads" : "TikTok, Facebook & Instagram ads";
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

async function request(path, token, options = {}) {
  const response = await fetch(`/api/admin/${path}`, {
    ...options,
    // The established admin API accepts the raw session JWT. Keeping this
    // consistent with the rest of the dashboard avoids a proxy adding a
    // second authentication format before the backend receives it.
    headers: { authorization: token, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to complete that action.");
  return data;
}

function StatusMark({ okay, label }) {
  return <span className={okay ? styles.ready : styles.missing}>{okay ? <FiCheckCircle /> : <FiAlertTriangle />}{label}</span>;
}

export default function TelegramAccess() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", chatId: "", product: "ads-course", active: true });
  const token = typeof window === "undefined" ? "" : localStorage.getItem("adminToken");

  const load = async (quiet = false) => {
    if (!token) return;
    if (!quiet) setLoading(true);
    setError("");
    try { setData(await request("telegram-access", token)); }
    catch (err) { setError(err.message); }
    finally { if (!quiet) setLoading(false); }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (key, action) => {
    setBusy(key); setError(""); setNotice("");
    try { const result = await action(); setNotice(result.message || "Saved."); await load(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(""); }
  };
  const buyers = useMemo(() => (data?.identities || []).filter((buyer) => `${buyer.email} ${buyer.telegram.name} ${buyer.telegram.username}`.toLowerCase().includes(search.trim().toLowerCase())), [data, search]);
  const setup = data?.setup || {};

  if (loading) return <div className={styles.loading}><FiLoader className={styles.spin} /> Loading Telegram access…</div>;
  return <div className={styles.page}>
    <section className={styles.hero}>
      <div><span className={styles.eyebrow}><FiShield /> PROTECTED COURSE DELIVERY</span><h2>Telegram course access</h2><p>Give each paid buyer a secure, account-bound route into only the courses they purchased. A channel link alone can never grant access.</p></div>
      <div className={styles.heroStats}><span><b>{data?.summary?.configuredChannels || 0}</b> active channels</span><span><b>{data?.summary?.activeBuyers || 0}</b> linked buyers</span></div>
    </section>

    {(notice || error) && <p className={error ? styles.error : styles.notice} role={error ? "alert" : "status"}>{error || notice}</p>}

    <section className={styles.card}>
      <div className={styles.cardHead}><div><span className={styles.kicker}>BOT CONNECTION</span><h3>Connection readiness</h3><p>The secret values stay on your backend. This only checks whether each required value exists.</p></div><button className={styles.secondary} onClick={() => load()} disabled={busy}><FiRefreshCw /> Refresh</button></div>
      <div className={styles.statusGrid}>
        <StatusMark okay={setup.enabled} label="Telegram enabled" />
        <StatusMark okay={setup.tokenConfigured} label="Bot token saved" />
        <StatusMark okay={setup.usernameConfigured} label="Bot username saved" />
        <StatusMark okay={setup.secretConfigured} label="Webhook secret saved" />
        <StatusMark okay={setup.webhookConfigured} label="Webhook URL saved" />
      </div>
      <div className={styles.connectionFooter}><p>{setup.ready ? <>Ready to connect <strong>@{setup.botUsername}</strong> to your backend.</> : "Complete the missing environment settings, redeploy the backend, then return here."}</p><button className={styles.primary} disabled={!setup.ready || Boolean(busy)} onClick={() => run("setup", () => request("telegram-access/setup", token, { method: "POST", body: "{}" }))}>{busy === "setup" ? <FiLoader className={styles.spin} /> : <FiLink />} Connect / refresh webhook</button></div>
    </section>

    <section className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardHead}><div><span className={styles.kicker}>CHANNEL MAP</span><h3>Course channels</h3><p>Map each private channel once. The bot creates an expiring join-request link for an eligible buyer.</p></div><FiSend className={styles.cardIcon} /></div>
        <form className={styles.channelForm} onSubmit={(event) => { event.preventDefault(); run("channel", async () => { const result = await request("telegram-access/channels", token, { method: "POST", body: JSON.stringify(form) }); setForm({ title: "", chatId: "", product: "ads-course", active: true }); return result; }); }}>
          <input required value={form.title} maxLength={120} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Channel name" aria-label="Channel name" />
          <input required value={form.chatId} onChange={(event) => setForm({ ...form, chatId: event.target.value })} placeholder="Telegram channel ID (e.g. -100…)" aria-label="Telegram channel ID" />
          <select value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} aria-label="Course"><option value="ads-course">TikTok, Facebook & Instagram course</option><option value="whatsapp-course">WhatsApp Status ads course</option></select>
          <button className={styles.primary} disabled={Boolean(busy)}>{busy === "channel" ? <FiLoader className={styles.spin} /> : <FiPlus />} Save channel</button>
        </form>
        <div className={styles.channelList}>{(data?.channels || []).length ? data.channels.map((channel) => <article key={channel.id} className={`${styles.channel} ${!channel.active ? styles.inactive : ""}`}><div className={styles.channelBadge}><FiSend /></div><div><strong>{channel.title}</strong><small>{productLabel(channel.product)} · {channel.chatId}</small></div><span className={channel.active ? styles.live : styles.off}>{channel.active ? "Active" : "Detected / disabled"}</span>{channel.active ? <button className={styles.textButton} disabled={Boolean(busy)} onClick={() => run(`disable-${channel.id}`, () => request(`telegram-access/channels/${channel.id}`, token, { method: "DELETE" }))}><FiSlash /> Disable</button> : <button className={styles.textButton} disabled={Boolean(busy)} onClick={() => { setForm({ title: channel.title, chatId: channel.chatId, product: channel.product, active: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><FiPlus /> Configure</button>}</article>) : <p className={styles.empty}>No channels are mapped yet. Save the Telegram channel IDs above, or connect the webhook and post once in each channel to discover them.</p>}</div>
      </div>
    </section>

    <section className={styles.card}>
      <div className={styles.cardHead}><div><span className={styles.kicker}>BUYER ACCESS</span><h3>Linked Telegram accounts</h3><p>Only the first Telegram account that enters a paid email is linked. Revoke access here whenever necessary.</p></div><div className={styles.search}><FiUsers /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a buyer or Telegram username" /></div></div>
      <div className={styles.buyerList}>{buyers.length ? buyers.map((buyer) => <article className={styles.buyer} key={buyer.id}><div className={styles.avatar}>{(buyer.telegram.name || buyer.email).slice(0, 1).toUpperCase()}</div><div className={styles.buyerDetails}><strong>{buyer.email}</strong><span>{buyer.telegram.name || "Telegram user"}{buyer.telegram.username ? ` · @${buyer.telegram.username}` : ""}</span><small>Linked {formatDate(buyer.boundAt)} · Last access {formatDate(buyer.lastAccessAt)}</small><div className={styles.accessPills}>{buyer.access.length ? buyer.access.map((access) => <span key={access.id} className={access.status === "approved" ? styles.approved : styles.revoked}>{access.channel?.title || "Mapped channel"} · {access.status}</span>) : <span className={styles.waiting}>Waiting for a join request</span>}</div></div><div className={styles.buyerAction}>{buyer.revokedAt ? <><span className={styles.revokedLabel}>Revoked</span><button className={styles.restore} disabled={Boolean(busy)} onClick={() => run(`restore-${buyer.id}`, () => request(`telegram-access/${buyer.id}/restore`, token, { method: "POST", body: "{}" }))}>{busy === `restore-${buyer.id}` ? <FiLoader className={styles.spin} /> : <FiCheckCircle />} Restore</button></> : <button className={styles.revoke} disabled={Boolean(busy)} onClick={() => { const reason = window.prompt("Optional reason for revoking this buyer’s Telegram course access:", "") || ""; run(`revoke-${buyer.id}`, () => request(`telegram-access/${buyer.id}/revoke`, token, { method: "POST", body: JSON.stringify({ reason }) })); }}><FiLock /> {busy === `revoke-${buyer.id}` ? "Revoking…" : "Revoke access"}</button>}</div></article>) : <p className={styles.empty}>No linked Telegram accounts yet.</p>}</div>
    </section>
    <aside className={styles.safety}><FiLock /><p><strong>How access stays protected:</strong> payment is verified by your backend first, one Telegram account is bound to the buyer email, and every generated channel link is a short-lived join request approved only for that exact account.</p></aside>
  </div>;
}
