import { useState } from "react";
import { useRouter } from "next/router";
import API from "../utils/api";
import styles from "../styles/Crm.module.css";

export default function CrmLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/crm/login", { email, password });

      localStorage.setItem("crmToken", res.data.token);
      localStorage.setItem("crmStaff", JSON.stringify(res.data.staff));
      router.push("/crm-dashboard");
    } catch {
      alert("Invalid CRM login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={login}>
        <span className={styles.badge}>Joshspot CRM</span>
        <h1>Staff Login</h1>
        <p>Access client onboarding records based on your staff role.</p>

        <label>Email</label>
        <input
          placeholder="staff@joshspotmedia.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          placeholder="Enter password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
