import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import API from "../utils/api";
import styles from "../styles/Crm.module.css";

const emptyForm = {
  businessName: "",
  amountPaid: "",
  servicePaidFor: "Meta ads setup",
  clientLoginDetails: "",
  landingPageLogins: "",
  landingPageLink: "",
  clientNumber: "",
};

const fieldLabels = {
  businessName: "Name / Business name",
  amountPaid: "Amount paid",
  servicePaidFor: "Service paid for",
  clientLoginDetails: "Client login details",
  landingPageLogins: "Landing page logins",
  landingPageLink: "Landing page link",
  clientNumber: "Client number",
};

const fieldOrder = [
  "businessName",
  "amountPaid",
  "servicePaidFor",
  "clientLoginDetails",
  "landingPageLogins",
  "landingPageLink",
  "clientNumber",
];

export default function CrmDashboard() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [clients, setClients] = useState([]);
  const [permissions, setPermissions] = useState({ canCreate: false, fields: [] });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);

  const editableFields = useMemo(
    () => fieldOrder.filter((field) => permissions.fields.includes(field)),
    [permissions.fields],
  );

  const fetchClients = useCallback(async () => {
    try {
      const res = await API.get("/crm/clients");

      setClients(res.data.clients);
      setPermissions(res.data.permissions);
    } catch {
      localStorage.removeItem("crmToken");
      localStorage.removeItem("crmStaff");
      router.push("/crm-login");
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

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const startCreate = () => {
    setEditingId("");
    setForm(emptyForm);
  };

  const startEdit = (client) => {
    setEditingId(client._id);
    setForm({
      ...emptyForm,
      ...fieldOrder.reduce((values, field) => {
        values[field] = client[field] === "******" ? "" : client[field] || "";
        return values;
      }, {}),
    });
  };

  const saveClient = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = editableFields.reduce((values, field) => {
      values[field] = field === "amountPaid" ? Number(form[field] || 0) : form[field];
      return values;
    }, {});

    try {
      if (editingId) {
        await API.put(`/crm/clients/${editingId}`, payload);
      } else {
        await API.post("/crm/clients", payload);
      }

      setForm(emptyForm);
      setEditingId("");
      fetchClients();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save client");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("crmToken");
    localStorage.removeItem("crmStaff");
    router.push("/crm-login");
  };

  const canShowForm = permissions.canCreate || editingId;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.badge}>CRM Dashboard</span>
          <h1>Client Onboarding</h1>
          <p>Manage client setup details with role-based access.</p>
        </div>

        <div className={styles.staffCard}>
          <strong>{staff?.name || "Staff"}</strong>
          <span>{staff?.role || "CRM"}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <section className={styles.summaryGrid}>
        <div>
          <span>Total clients</span>
          <strong>{clients.length}</strong>
        </div>
        <div>
          <span>Your role</span>
          <strong>{staff?.role || "-"}</strong>
        </div>
        <div>
          <span>Visible fields</span>
          <strong>{permissions.fields.length}</strong>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{editingId ? "Update Client" : "Add New Client"}</h2>
            {permissions.canCreate && (
              <button className={styles.secondaryBtn} onClick={startCreate}>
                New client
              </button>
            )}
          </div>

          {canShowForm ? (
            <form className={styles.form} onSubmit={saveClient}>
              {editableFields.map((field) => (
                <label key={field}>
                  <span>{fieldLabels[field]}</span>
                  {field === "servicePaidFor" ? (
                    <select
                      value={form[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                    >
                      <option>Meta ads setup</option>
                      <option>TikTok ads setup - DM </option>
                      <option>Tiktok Ads Setup - Landing Page </option>
                    </select>
                  ) : field.includes("Details") || field.includes("Logins") ? (
                    <textarea
                      value={form[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                    />
                  ) : (
                    <input
                      type={field === "amountPaid" ? "number" : "text"}
                      value={form[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                    />
                  )}
                </label>
              ))}

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Client"}
              </button>
            </form>
          ) : (
            <p className={styles.emptyState}>
              Setup staff can update existing clients only. Select a client below.
            </p>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Existing Clients</h2>
            <span>{clients.length} records</span>
          </div>

          <div className={styles.clientList}>
            {clients.map((client) => (
              <article key={client._id} className={styles.clientCard}>
                <div className={styles.clientTop}>
                  <div>
                    <h3>{client.businessName}</h3>
                    <span>{client.servicePaidFor}</span>
                  </div>
                  <button onClick={() => startEdit(client)}>Update</button>
                </div>

                <div className={styles.clientFields}>
                  {fieldOrder.map((field) => (
                    <p key={field}>
                      <strong>{fieldLabels[field]}:</strong>{" "}
                      <span>
                        {field === "amountPaid" && client[field] !== "******"
                          ? Number(client[field] || 0).toLocaleString()
                          : client[field] || "-"}
                      </span>
                    </p>
                  ))}
                </div>
              </article>
            ))}

            {clients.length === 0 && (
              <p className={styles.emptyState}>No clients have been added yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
