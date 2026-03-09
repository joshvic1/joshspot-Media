import { useState } from "react";
import API from "../utils/api";
import { useRouter } from "next/router";
import styles from "../styles/Admin.module.css";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await API.post("/admin/login", {
        email,
        password,
      });

      localStorage.setItem("adminToken", res.data.token);

      router.push("/admin-7812er");
    } catch {
      alert("Invalid login");
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Admin Login</h1>

        <input
          className={styles.loginInput}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br />
        <br />

        <input
          className={styles.loginInput}
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button className={styles.loginButton} onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}
