import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import API from "../utils/api";
import styles from "../styles/Crm.module.css";

const serviceOptions = [
  "TikTok Ads Landing Page",
  "TikTok DM Ads",
  "Meta Ads Landing Page",
  "Meta DM Ads",
];

const emptyForm = {
  businessName: "",
  amountPaid: "",
  clientLoginDetails: "",
  videoLinks: "",
  servicePaidFor: serviceOptions[0],
  note: "",
};

const fieldLabels = {
  businessName: "Business name",
  amountPaid: "Amount paid",
  clientLoginDetails: "Client login details",
  videoLinks: "Links to videos",
  servicePaidFor: "Service paid for",
  note: "Note",
};

const fieldOrder = [
  "businessName",
  "amountPaid",
  "clientLoginDetails",
  "videoLinks",
  "servicePaidFor",
  "note",
];

export default function CrmAdsDashboard() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [clients, setClients] = useState([]);
  const [permissions, setPermissions] = useState({ canCreate: false, fields: [] });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [pendingScrollClientId, setPendingScrollClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
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
      const res = await API.get("/crm/ads-clients");

      setClients(res.data.clients);
      setPermissions(res.data.permissions);
      setLoadError("");
      return res.data.clients;
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem("crmToken");
        localStorage.removeItem("crmStaff");
        router.push("/crm-login");
      } else {
        setLoadError(
          error.response?.data?.message ||
            "Unable to load ads clients. Please refresh the page.",
        );
      }

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

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
    setIsFormOpen(false);
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
        const response = await API.put(`/crm/ads-clients/${editingId}`, payload);
        setPendingScrollClientId(response.data._id);
        await fetchClients();
      } else {
        const response = await API.post("/crm/ads-clients", payload);
        setActiveSearch("");
        setSearchInput("");
        setPendingScrollClientId(response.data._id);
        await fetchClients();
      }

      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save ads client");
    } finally {
      setSaving(false);
    }
  };

  const toggleAdsPublished = async (client) => {
    const nextValue = !client.adsPublished;

    setClients((current) =>
      current.map((item) =>
        item._id === client._id ? { ...item, adsPublished: nextValue } : item,
      ),
    );

    try {
      await API.put(`/crm/ads-clients/${client._id}`, {
        adsPublished: nextValue,
      });
    } catch (error) {
      setClients((current) =>
        current.map((item) =>
          item._id === client._id
            ? { ...item, adsPublished: client.adsPublished }
            : item,
        ),
      );
      alert(error.response?.data?.message || "Unable to update ads published status");
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

  const canShowForm = isFormOpen || editingId;

  return (
    <div className={styles.page}>
      <nav className={styles.dashboardNav}>
        <div className={styles.navBrand}>
          <strong>Ads</strong>
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
                onClick={() => navigateDashboard("/crm-verification-dashboard")}
                type="button"
              >
                <strong>Verification Dashboard</strong>
                <span>ID records</span>
              </button>
              <button
                aria-current="page"
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
          <span className={styles.badge}>Ads Dashboard</span>
          <h1>Ads Clients</h1>
          <p>Track ad delivery clients, video links, services, and notes.</p>
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
            <h2>{editingId ? "Update Ads Client" : "Add Ads Client"}</h2>
            {permissions.canCreate && (
              <button className={styles.secondaryBtn} onClick={startCreate}>
                + Add client
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
                      onChange={(event) => handleChange(field, event.target.value)}
                      required
                    >
                      {serviceOptions.map((service) => (
                        <option key={service}>{service}</option>
                      ))}
                    </select>
                  ) : field === "clientLoginDetails" || field === "videoLinks" || field === "note" ? (
                    <textarea
                      value={form[field]}
                      onChange={(event) => handleChange(field, event.target.value)}
                      required={field !== "note" && field !== "clientLoginDetails"}
                    />
                  ) : (
                    <input
                      type={field === "amountPaid" ? "number" : "text"}
                      value={form[field]}
                      onChange={(event) => handleChange(field, event.target.value)}
                      required={field !== "note"}
                    />
                  )}
                </label>
              ))}

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Ads Client"}
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
          ) : (
            <p className={styles.emptyState}>
              {permissions.canCreate
                ? "Click + Add client to open the form."
                : "Setup staff can update existing ads clients only. Select a client below."}
            </p>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Existing Ads Clients</h2>
            <span>
              {filteredClients.length} of {clients.length} records
            </span>
          </div>

          {loadError && <p className={styles.errorState}>{loadError}</p>}

          <form className={styles.searchBar} onSubmit={searchClients}>
            <input
              placeholder="Search by business name, service, video link, note..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
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

                <label className={styles.publishToggle}>
                  <input
                    checked={Boolean(client.adsPublished)}
                    onChange={() => toggleAdsPublished(client)}
                    type="checkbox"
                  />
                  <span className={styles.toggleControl} />
                  <span className={styles.toggleText}>
                    {client.adsPublished ? "Ads Published" : "Mark Ads Published"}
                  </span>
                </label>

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
              <p className={styles.emptyState}>No ads clients have been added yet.</p>
            )}

            {clients.length > 0 && filteredClients.length === 0 && (
              <p className={styles.emptyState}>No ads client matched your search.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
