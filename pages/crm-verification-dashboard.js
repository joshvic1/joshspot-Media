import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import API from "../utils/api";
import styles from "../styles/Crm.module.css";

const emptyVerificationForm = {
  name: "",
  businessName: "",
  clientLoginDetails: "",
  amountPaid: "",
  clientNumber: "",
  idCard: null,
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CrmVerificationDashboard() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyVerificationForm);
  const [saving, setSaving] = useState(false);
  const [pendingScrollClientId, setPendingScrollClientId] = useState("");
  const clientRefs = useRef({});

  const fetchClients = useCallback(async () => {
    try {
      const response = await API.get("/crm/verification-clients");
      setClients(response.data);
      return response.data;
    } catch {
      localStorage.removeItem("crmToken");
      localStorage.removeItem("crmStaff");
      router.push("/crm-login");
      return [];
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("crmToken");
    const storedStaff = localStorage.getItem("crmStaff");

    if (!token) {
      router.push("/crm-login");
      return;
    }

    if (storedStaff) {
      setStaff(JSON.parse(storedStaff));
    }

    fetchClients();
  }, [fetchClients, router]);

  useEffect(() => {
    if (!pendingScrollClientId) {
      return;
    }

    const clientNode = clientRefs.current[pendingScrollClientId];

    if (clientNode) {
      clientNode.scrollIntoView({ behavior: "smooth", block: "center" });
      setPendingScrollClientId("");
    }
  }, [clients, pendingScrollClientId]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      setForm((current) => ({ ...current, idCard: null }));
      return;
    }

    const data = await readFileAsDataUrl(file);

    setForm((current) => ({
      ...current,
      idCard: {
        fileName: file.name,
        mimeType: file.type,
        data,
      },
    }));
  };

  const saveClient = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await API.post("/crm/verification-clients", {
        ...form,
        amountPaid: Number(form.amountPaid || 0),
      });

      setForm(emptyVerificationForm);
      setPendingScrollClientId(response.data._id);
      await fetchClients();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save verification client");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("crmToken");
    localStorage.removeItem("crmStaff");
    router.push("/crm-login");
  };

  return (
    <div className={styles.page}>
      <nav className={styles.dashboardNav}>
        <label>
          <span className={styles.navLabel}>Dashboard menu</span>
          <select
            value="/crm-verification-dashboard"
            onChange={(event) => router.push(event.target.value)}
          >
            <option value="/crm-dashboard">Setup Dashboard</option>
            <option value="/crm-verification-dashboard">Verification Dashboard</option>
          </select>
        </label>
      </nav>

      <header className={styles.header}>
        <div>
          <span className={styles.badge}>Verification Dashboard</span>
          <h1>Verification Clients</h1>
          <p>Add and manage clients who paid for verification service.</p>
        </div>

        <div className={styles.staffCard}>
          <strong>{staff?.name || "Staff"}</strong>
          <span>{staff?.role || "CRM"}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <section className={styles.contentGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Add Verification Client</h2>
            <span>Service: Verification</span>
          </div>

          <form className={styles.form} onSubmit={saveClient}>
            <label>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                required
              />
            </label>

            <label>
              <span>Business name</span>
              <input
                value={form.businessName}
                onChange={(event) => handleChange("businessName", event.target.value)}
                required
              />
            </label>

            <label>
              <span>Client login details</span>
              <textarea
                value={form.clientLoginDetails}
                onChange={(event) =>
                  handleChange("clientLoginDetails", event.target.value)
                }
                required
              />
            </label>

            <label>
              <span>Amount paid</span>
              <input
                type="number"
                min="0"
                value={form.amountPaid}
                onChange={(event) => handleChange("amountPaid", event.target.value)}
                required
              />
            </label>

            <label>
              <span>Client number</span>
              <input
                value={form.clientNumber}
                onChange={(event) => handleChange("clientNumber", event.target.value)}
                required
              />
            </label>

            <label>
              <span>ID card upload</span>
              <input
                accept="image/*,.pdf"
                type="file"
                onChange={(event) => handleFileUpload(event.target.files?.[0])}
                required
              />
              {form.idCard?.fileName && (
                <small className={styles.fileHint}>{form.idCard.fileName}</small>
              )}
            </label>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Verification Client"}
            </button>
          </form>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Verification Clients</h2>
            <span>{clients.length} records</span>
          </div>

          <div className={styles.clientList}>
            {clients.map((client) => (
              <article
                className={styles.clientCard}
                key={client._id}
                ref={(node) => {
                  if (node) {
                    clientRefs.current[client._id] = node;
                  }
                }}
              >
                <div className={styles.clientTop}>
                  <div>
                    <h3>{client.businessName}</h3>
                    <span>{client.service || "Verification"}</span>
                  </div>
                </div>

                <div className={styles.clientFields}>
                  <p>
                    <strong>Name:</strong> <span>{client.name || "-"}</span>
                  </p>
                  <p>
                    <strong>Amount paid:</strong>{" "}
                    <span>{Number(client.amountPaid || 0).toLocaleString()}</span>
                  </p>
                  <p>
                    <strong>Client number:</strong>{" "}
                    <span>{client.clientNumber || "-"}</span>
                  </p>
                  <p>
                    <strong>Login details:</strong>{" "}
                    <span>{client.clientLoginDetails || "-"}</span>
                  </p>
                  <p>
                    <strong>ID card:</strong>{" "}
                    {client.idCard?.data ? (
                      <a
                        className={styles.fileLink}
                        download={client.idCard.fileName || "verification-id-card"}
                        href={client.idCard.data}
                      >
                        View / Download
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </p>
                </div>
              </article>
            ))}

            {clients.length === 0 && (
              <p className={styles.emptyState}>
                No verification clients have been added yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
