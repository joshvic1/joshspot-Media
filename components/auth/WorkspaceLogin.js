import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiCheck, FiUsers, FiBarChart2 } from "react-icons/fi";
import API from "../../utils/api";
import styles from "../../styles/WorkspaceLogin.module.css";
export default function WorkspaceLogin({ admin = false }) {
  const router = useRouter();
  const [email,setEmail] = useState(""), [password,setPassword] = useState(""), [visible,setVisible] = useState(false), [loading,setLoading] = useState(false), [error,setError] = useState("");
  const login = async (event) => {
    event.preventDefault(); if (loading) return; setLoading(true); setError("");
    try {
      const { data } = await API.post(admin ? "/admin/login" : "/crm/login", { email:email.trim(),password });
      if (admin) localStorage.setItem("adminToken",data.token);
      else { localStorage.setItem("crmToken",data.token);localStorage.setItem("crmStaff",JSON.stringify(data.staff)); }
      await router.push(admin ? "/admin-7812er" : "/crm-dashboard");
    } catch (error) { setError(error.response?.status === 401 ? "The email or password is incorrect. Please try again." : "We couldn't sign you in right now. Please try again."); }
    finally { setLoading(false); }
  };
  return <div className={styles.page}>
    <Head><title>{`${admin ? "Admin" : "Staff"} sign in · Joshspot Media`}</title><meta name="robots" content="noindex,nofollow" /></Head>
    <aside className={styles.brandPanel}><Link href="/" className={styles.brand}><span>j.</span><div>Joshspot Media<small>BUSINESS WORKSPACE</small></div></Link>
      <div className={styles.brandCopy}><span className={styles.eyebrow}>A LITTLE CLARITY. A LOT OF PROGRESS.</span><h1>{admin ? <>Your business.<br />A clearer view.</> : <>Good work starts<br />with a clear workspace.</>}</h1>
        <p>{admin ? "Keep an eye on your customers, payments and services. Everything you need to move your business forward." : "Bring client details, verification and ad delivery together. Pick up where you left off and keep things moving."}</p>
        <div className={styles.workspaceCard}><div><span className={styles.cardIcon}>{admin ? <FiBarChart2 /> : <FiUsers />}</span><strong>{admin ? "Your business, organised" : "Your team, connected"}</strong><span className={styles.liveDot} /></div>
          {(admin ? ["A clear view of your revenue","Customer details in one place","Simple, organised follow-ups"] : ["Client onboarding and setup","Verification records and documents","Campaign assets and delivery"]).map((text) => <p key={text}><FiCheck />{text}</p>)}
        </div>
      </div><p className={styles.brandFooter}>Built for the work behind your growth.</p>
    </aside>
    <main className={styles.main}><span className={styles.workspaceBadge}><FiLock /> {admin ? "ADMIN WORKSPACE" : "TEAM WORKSPACE"}</span>
      <div className={styles.formWrap}><span className={styles.kicker}>WELCOME BACK</span><h2>{admin ? "Sign in to your dashboard" : "Sign in to your workspace"}</h2><p>{admin ? "Manage your business with a little more clarity." : "Your clients and your next steps are right here."}</p>
        <form onSubmit={login}><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={admin ? "Your admin email" : "Your staff email"} disabled={loading} />
          <label htmlFor="login-password">Password</label><div className={styles.password}><input id="login-password" type={visible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" disabled={loading} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible((value) => !value)}>{visible ? <FiEyeOff /> : <FiEye />}</button></div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} type="submit" disabled={loading}>{loading ? "Signing you in…" : "Sign in"}<FiArrowRight /></button>
        </form><p className={styles.help}>{admin ? "Use your administrator account to access this workspace." : "Use the staff account provided by your administrator."}</p>
      </div><footer className={styles.footer}>Joshspot Media <span>One workspace. More clarity.</span></footer>
    </main>
  </div>;
}
