import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [pendingScrollClientId, setPendingScrollClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const clientRefs = useRef({});

  const editableFields = useMemo(
    () => fieldOrder.filter((field) => permissions.fields.includes(field)),
    [permissions.fields],
  );

  const filteredClients = useMemo(() => {
    const search = activeSearch.trim().toLowerCase();

    if (!search) {
      return clients;
    }

    return clients.filter((client) =>
      fieldOrder.some((field) =>
        String(client[field] || "")
          .toLowerCase()
          .includes(search),
      ),
    );
  }, [activeSearch, clients]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await API.get("/crm/clients");

      setClients(res.data.clients);
      setPermissions(res.data.permissions);
      return res.data.clients;
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
  }, [clients, filteredClients, pendingScrollClientId]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const startCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setIsFormOpen(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const startEdit = (client) => {
    setEditingId(client._id);
    setIsFormOpen(true);
    setForm({
      ...emptyForm,
      ...fieldOrder.reduce((values, field) => {
        values[field] = client[field] === "******" ? "" : client[field] || "";
        return values;
      }, {}),
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const searchClients = (event) => {
    event.preventDefault();
    setActiveSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
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
        await fetchClients();
      } else {
        const res = await API.post("/crm/clients", payload);
        setActiveSearch("");
        setSearchInput("");
        setIsFormOpen(false);
        setPendingScrollClientId(res.data._id);
        await fetchClients();
      }

      setForm(emptyForm);
      setEditingId("");
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

  const canShowForm = isFormOpen || editingId;

  return (
    <div className={styles.page}>
      <nav className={styles.dashboardNav}>
        <div>
          <span className={styles.navLabel}>Main menu</span>
          <strong>CRM Workspace</strong>
        </div>

        <div className={styles.navActions}>
          <button
            aria-current="page"
            className={styles.navButton}
            onClick={() => router.push("/crm-dashboard")}
            type="button"
          >
            <span>Setup</span>
            <small>Client onboarding</small>
          </button>
          <button
            className={styles.navButton}
            onClick={() => router.push("/crm-verification-dashboard")}
            type="button"
          >
            <span>Verification</span>
            <small>ID records</small>
          </button>
        </div>
      </nav>

      <header className={styles.header}>
        <div>
          <span className={styles.badge}>Setup Dashboard</span>
          <h1>Setup Clients</h1>
          <p>Manage ad setup client details with role-based access.</p>
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
            <h2>{editingId ? "Update Client" : "Add New Client"}</h2>
            {permissions.canCreate && (
              <button className={styles.secondaryBtn} onClick={startCreate}>
                + Add new client
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
                      <option>TikTok ads setup - DM</option>
                      <option>Tiktok Ads Setup - Landing Page</option>
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
              {permissions.canCreate
                ? "Click + Add new client to open the form."
                : "Setup staff can update existing clients only. Select a client below."}
            </p>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Existing Clients</h2>
            <span>
              {filteredClients.length} of {clients.length} records
            </span>
          </div>

          <form className={styles.searchBar} onSubmit={searchClients}>
            <input
              placeholder="Search by business name, number, service, link, login details..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">Search</button>
            {activeSearch && (
              <button type="button" onClick={clearSearch}>
                Clear
              </button>
            )}
          </form>

          <div className={styles.clientList}>
            {filteredClients.map((client) => (
              <article
                key={client._id}
                className={styles.clientCard}
                ref={(node) => {
                  if (node) {
                    clientRefs.current[client._id] = node;
                  }
                }}
              >
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

            {clients.length > 0 && filteredClients.length === 0 && (
              <p className={styles.emptyState}>No client matched your search.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
