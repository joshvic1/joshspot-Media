import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiCopy, FiFileText, FiArrowUpRight, FiCheck } from "react-icons/fi";
import API from "../utils/api";
import CrmLayout from "../components/crm/CrmLayout";
import { copyMessage } from "../utils/copyMessage.mjs";
import styles from "../styles/InvoiceGenerator.module.css";

const money=value=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:2}).format(Number(value||0));
export default function InvoiceGenerator() {
  const router=useRouter();
  const [staff,setStaff]=useState(null),[sessionError,setSessionError]=useState("");
  const [form,setForm]=useState({amount:"",customerName:"",customerEmail:"",note:""});
  const [invoice,setInvoice]=useState(null),[invoiceUrl,setInvoiceUrl]=useState("");
  const [loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  useEffect(()=>{
    let active=true;
    API.get("/crm/session").then(({data})=>{if(active)setStaff(data.staff);}).catch(error=>{
      if(!active)return;
      if(error.response?.status===401)router.replace("/crm-login");
      else setSessionError("Unable to verify your workspace. Reload to try again.");
    });
    return()=>{active=false;};
  },[router]);
  const logout=()=>{localStorage.removeItem("adminToken");localStorage.removeItem("crmToken");localStorage.removeItem("crmStaff");router.push("/crm-login");};
  const change=(key,value)=>setForm(previous=>({...previous,[key]:value}));
  async function create(event) {
    event.preventDefault();if(loading)return;
    setLoading(true);setError("");setNotice("");
    try {
      const {data}=await API.post("/invoice",{...form,amount:Number(form.amount)});
      setInvoice(data.invoice);setInvoiceUrl(data.invoiceUrl);setNotice("Invoice created. Your payment link is ready to share.");
    } catch(error) {setError(error.response?.data?.message||"Unable to create invoice. Please try again.");}
    finally {setLoading(false);}
  }
  async function copy(value,label) {
    setError("");setNotice("");
    try {await copyMessage(value);setNotice(label+" copied.");}
    catch {setError("Copy is unavailable. Select the text and copy it manually.");}
  }
  const transfer=invoice?.accountNumber&&invoice?.bankName;
  const paymentMessage=invoiceUrl ? `Pay ${money(invoice?.amount)} via the link below\n${invoiceUrl}${transfer?`\n\nOr pay to the account below\n${invoice.accountNumber}\n${invoice.bankName}\n${invoice.accountName||"Joshspot Media"}`:""}\n\nSend receipt after payment`:"";
  if(!staff)return <div className={styles.loading} role="status">{sessionError||"Opening your workspace…"}</div>;
  return <CrmLayout active="invoices" staff={staff} onLogout={logout}>
    {error&&<p className={styles.error} role="alert">{error}</p>}
    {notice&&<p className={styles.notice} role="status"><FiCheck />{notice}</p>}
    <div className={styles.layout}>
      <section className={styles.panel}><div className={styles.sectionHeading}><span className={styles.icon}><FiFileText /></span><div><h2>New invoice</h2><p>A payment link, ready for your customer.</p></div></div>
        <form onSubmit={create} className={styles.form}>
          <label>Amount (₦)<input type="number" inputMode="decimal" min="100" step=".01" required placeholder="50,000" value={form.amount} onChange={event=>change("amount",event.target.value)} disabled={loading} /></label>
          <label>Customer name <small>Optional</small><input autoComplete="name" placeholder="Name or business name" value={form.customerName} onChange={event=>change("customerName",event.target.value)} disabled={loading} /></label>
          <label>Customer email <small>Optional</small><input type="email" autoComplete="email" placeholder="customer@example.com" value={form.customerEmail} onChange={event=>change("customerEmail",event.target.value)} disabled={loading} /></label>
          <label>Payment note <small>Optional</small><textarea rows={3} placeholder="What is this payment for?" value={form.note} onChange={event=>change("note",event.target.value)} disabled={loading} /></label>
          <button className={styles.primary} disabled={loading}>{loading?"Generating invoice…":"Generate invoice"}<FiArrowUpRight /></button>
          <p className={styles.hint}>Creates a payment request. The invoice is only paid after payment is confirmed.</p>
        </form>
      </section>
      <aside className={styles.output}>{invoiceUrl ? <>
        <section className={styles.panel}><span className={styles.kicker}>READY TO SHARE</span><h2>{invoice?.customerName||"Your customer’s invoice"}</h2><strong className={styles.total}>{money(invoice?.amount)}</strong>
          <label className={styles.linkLabel}>Payment link<input readOnly value={invoiceUrl} onFocus={event=>event.target.select()} /></label>
          <div className={styles.actions}><button onClick={()=>copy(invoiceUrl,"Invoice link")}><FiCopy />Copy link</button><a href={invoiceUrl} target="_blank" rel="noreferrer">Open invoice <FiArrowUpRight /></a></div>
        </section>
        <section className={styles.panel}><h2>Customer payment message</h2><pre className={styles.message}>{paymentMessage}</pre><button className={styles.primary} onClick={()=>copy(paymentMessage,"Payment message")}><FiCopy />Copy message</button></section>
        {transfer&&<section className={styles.panel}><h2>Transfer details</h2>{[["Amount",money(invoice.amount)],["Bank name",invoice.bankName],["Account number",invoice.accountNumber],["Account name",invoice.accountName||"Joshspot Media"]].map(([label,value])=><div className={styles.copyRow} key={label}><div><small>{label}</small><strong>{value}</strong></div><button onClick={()=>copy(value,label)} aria-label={"Copy "+label}><FiCopy /></button></div>)}</section>}
      </> : <section className={styles.empty}><span className={styles.icon}><FiFileText /></span><h2>Your invoice will appear here</h2><p>Enter an amount and generate an invoice. Then copy the payment link, bank details or full message.</p></section>}</aside>
    </div>
  </CrmLayout>;
}

