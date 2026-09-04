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
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingScrollClientId, setPendingScrollClientId] = useState("");
  const formRef = useRef(null);
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

  const startEdit = (client) => {
    setEditingId(client._id);
    setForm({
      name: client.name || "",
      businessName: client.businessName || "",
      clientLoginDetails: client.clientLoginDetails || "",
      amountPaid: client.amountPaid === "******" ? "" : client.amountPaid || "",
      clientNumber: client.clientNumber || "",
      idCard: client.idCard || null,
    });

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const resetForm = () => {
    setEditingId("");
    setForm(emptyVerificationForm);
  };

  const saveClient = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = Object.fromEntries(
      Object.entries({
        ...form,
        amountPaid: staff?.role === "SS" ? Number(form.amountPaid || 0) : undefined,
        idCard: form.idCard?.data ? form.idCard : undefined,
      }).filter(([, value]) => value !== undefined),
    );

    try {
      const response = editingId
        ? await API.put(`/crm/verification-clients/${editingId}`, payload)
        : await API.post("/crm/verification-clients", payload);

      resetForm();
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

  const navigateDashboard = (path) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  const downloadIdCard = async (client) => {
    try {
      const response = await API.get(`/crm/verification-clients/${client._id}/id-card`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = client.idCard?.fileName || "verification-id-card";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to download ID card");
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.dashboardNav}>
        <div className={styles.navBrand}>
          <strong>Verification</strong>
          <span>Dashboard</span>
        </div>

        <div className={styles.menuWrap}>
          <button
            aria-expanded={isMenuOpen}
            aria-label="Open dashboard menu"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>

          {isMenuOpen && (
            <div className={styles.dropdownMenu}>
              <button
                onClick={() => navigateDashboard("/crm-dashboard")}
                type="button"
              >
                <strong>Setup Dashboard</strong>
                <span>Client onboarding</span>
              </button>
              <button
                aria-current="page"
                onClick={() => navigateDashboard("/crm-verification-dashboard")}
                type="button"
              >
                <strong>Verification Dashboard</strong>
                <span>ID records</span>
              </button>
              <button
                onClick={() => navigateDashboard("/crm-ads-dashboard")}
                type="button"
              >
                <strong>Ads Dashboard</strong>
                <span>Ad client delivery</span>
              </button>
            </div>
          )}
        </div>
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
        <div className={styles.panel} ref={formRef}>
          <div className={styles.panelHeader}>
            <h2>{editingId ? "Update Verification Client" : "Add Verification Client"}</h2>
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

            {staff?.role === "SS" && (
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
            )}

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
                required={!editingId}
              />
              {form.idCard?.fileName && (
                <small className={styles.fileHint}>{form.idCard.fileName}</small>
              )}
            </label>

            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Verification Client"}
            </button>

            {editingId && (
              <button
                className={styles.cancelButton}
                onClick={resetForm}
                type="button"
              >
                Cancel Update
              </button>
            )}
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
                  <button onClick={() => startEdit(client)}>Update</button>
                </div>

                <div className={styles.clientFields}>
                  <p>
                    <strong>Name:</strong> <span>{client.name || "-"}</span>
                  </p>
                  <p>
                    <strong>Amount paid:</strong>{" "}
                    <span>
                      {client.amountPaid === "******"
                        ? "******"
                        : Number(client.amountPaid || 0).toLocaleString()}
                    </span>
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
                    {client.idCard?.key ? (
                      <button
                        className={styles.fileLink}
                        onClick={() => downloadIdCard(client)}
                        type="button"
                      >
                        View / Download
                      </button>
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
