import { useState } from "react";
import { FiShare2, FiCheck } from "react-icons/fi";
import styles from "../styles/Public.module.css";
export default function ShareService({ service }) {
const [state,setState]=useState(""); const [fallback,setFallback]=useState("");
async function copyLink() {
const url = window.location.origin + "/services/" + service.slug;
try { await navigator.clipboard.writeText(url); setState("Link copied"); setFallback(""); }
catch { setFallback(url); setState("Select and copy this link"); }
}
return <div className={styles.shareWrap}><button type="button" className={styles.shareButton} onClick={copyLink} aria-label={"Copy link to " + service.title} title="Copy service link">{state === "Link copied" ? <FiCheck /> : <FiShare2 />}</button><span role="status" className={styles.copyStatus}>{state}</span>{fallback && <input className={styles.copyInput} aria-label="Service link" readOnly value={fallback} onFocus={e=>e.target.select()} />}</div>;
}
