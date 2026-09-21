import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import styles from "../../styles/AdsCalculator.module.css";

export default function CalculatorAccess({ children }) {
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function check() {
      try {
        const token = localStorage.getItem("adminToken") || localStorage.getItem("crmToken");
        if (!token) { setStatus("signin"); return; }
        const response = await fetch("/api/calculator-access", { headers: { authorization: token }, cache: "no-store", signal: controller.signal });
        if (!active) return;
        setStatus(response.ok && (await response.json()).allowed === true ? "allowed" : response.status === 401 ? "signin" : response.status === 403 ? "denied" : "error");
      } catch { if (active) setStatus("error"); }
    }
    check();
    return () => { active = false; controller.abort(); };
  }, []);
  if (status === "allowed") return children;
  return <div className={styles.page}><Head><title>Ads Calculator · Access</title><meta name="robots" content="noindex,nofollow" /></Head><main className={styles.workspace}>
    <h1>{status === "loading" ? "Checking access…" : status === "signin" ? "Sign in to use the calculator" : status === "denied" ? "Access restricted" : "We couldn’t verify your access"}</h1>
    <p role="status">{status === "loading" ? "Verifying your workspace account." : status === "error" ? "Please reload the page to try again." : "The Ads Calculator is available to CSS and admin accounts only."}</p>
    {status !== "loading" && <Link className={styles.secondary} href={status === "signin" ? "/crm-login" : "/crm-dashboard"}>{status === "signin" ? "Sign in" : "Back to CRM"}</Link>}
  </main></div>;
}
