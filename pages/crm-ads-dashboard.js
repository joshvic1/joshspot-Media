import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import API from "../utils/api";
import styles from "../styles/Crm.module.css";
import DeleteClient from "../components/crm/DeleteClient";
import CrmLayout from "../components/crm/CrmLayout";
import FundsBadge from "../components/crm/FundsBadge";
import ClientNameActions from "../components/crm/ClientNameActions";
import { canAccessInbox } from "../utils/inboxAccess";
import { FiSliders } from "react-icons/fi";

const fieldLabels = {
  clientNumber: "Client WhatsApp number",
  businessName: "Business name",
  amountPaid: "Amount paid",
  clientLoginDetails: "Client login details",
  videoLinks: "Links to videos",
  servicePaidFor: "Service paid for",
  note: "Note",
};

const serviceOptions = [
  "TikTok Ads Landing Page",
  "TikTok DM Ads",
  "Meta Ads Landing Page",
  "Meta DM Ads",
];

const fieldOrder = [
  "businessName",
  "clientNumber",
  "amountPaid",
  "clientLoginDetails",
  "videoLinks",
  "servicePaidFor",
  "note",
];

const PAGE_SIZE = 20;

const formatAddedDate = (date) => {
  if (!date) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

export default function CrmAdsDashboard() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [fundsStatusFilter, setFundsStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [fundsStatusInput, setFundsStatusInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState("");

  const filteredClients = useMemo(() => {
    const selectedName = nameFilter.trim().toLowerCase();
    const search = activeSearch.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesName = !selectedName || [client.businessName, client.name].some((value) =>
        String(value || "").toLowerCase().includes(selectedName),
      );
      const matchesSearch = !search || fieldOrder.some((field) =>
        String(client[field] || "").toLowerCase().includes(search),
      );
      const matchesService = !serviceFilter || client.servicePaidFor === serviceFilter;
      const matchesCategory = !categoryFilter || String(client.servicePaidFor || "").toLowerCase().includes(categoryFilter);
      const fundsStatus = client.fundsStatus || (client.fundsSent ? "sent" : "pending");
      const matchesFundsStatus = !fundsStatusFilter || fundsStatus === fundsStatusFilter;
      return matchesName && matchesSearch && matchesService && matchesCategory && matchesFundsStatus;
    });
  }, [activeSearch, categoryFilter, clients, fundsStatusFilter, nameFilter, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredClients.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredClients]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await API.get("/crm/ads-clients");

      setClients(res.data.clients);
      setLoadError("");
      setCurrentPage(1);
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
    const token = localStorage.getItem("adminToken") || localStorage.getItem("crmToken");
    

    if (!token) {
      router.push("/crm-login");
      return;
    }

    API.get("/crm/session").then(({ data }) => setStaff(data.staff)).catch(() => setStaff(null));

    fetchClients();
  }, [fetchClients, router]);

  const searchClients = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    setNameFilter("");
    setActiveSearch(searchInput);
    setServiceFilter(serviceInput);
    setFundsStatusFilter(fundsStatusInput);
    setCategoryFilter(categoryInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setNameFilter("");
    setServiceFilter("");
    setFundsStatusFilter("");
    setCategoryFilter("");
    setServiceInput("");
    setFundsStatusInput("");
    setCategoryInput("");
    setCurrentPage(1);
  };

  const filterByClientName = (name) => {
    setSearchInput(name);
    setActiveSearch(name);
    setNameFilter(name);
    setCurrentPage(1);
  };

  const openInbox = (conversationId) => {
    router.push(`/crm-inbox?conversation=${encodeURIComponent(conversationId)}`);
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

  const [fundsSaving, setFundsSaving] = useState({});
  const changeFundsStatus = async (client, fundsStatus) => {
    if (!staff?.admin || fundsSaving[client._id]) return;
    setFundsSaving((current) => ({ ...current, [client._id]: true }));
    try {
      const { data } = await API.put(`/crm/ads-clients/${client._id}`, { fundsStatus });
      if (data.fundsStatus !== fundsStatus) throw new Error("The backend needs updating before funds status can be saved.");
      setClients((current) => current.map((item) => item._id === client._id ? { ...item, fundsStatus: data.fundsStatus, fundsSent: data.fundsSent } : item));
    } catch (error) {
      const message = error.response?.data?.message;
      alert(message === "No allowed fields to update" ? "The hosted backend needs the latest funds-status update deployed. Your change has not been saved." : message || error.message || "Unable to save funds status");
    } finally {
      setFundsSaving((current) => ({ ...current, [client._id]: false }));
    }
  };

  const logout = () => {
    if (staff?.admin) { localStorage.removeItem("adminToken"); router.push("/admin-login-0tT6Yc1"); return; }
    localStorage.removeItem("crmToken");
    localStorage.removeItem("crmStaff");
    router.push("/crm-login");
  };

  return (
    <CrmLayout active="ads" staff={staff} onLogout={logout}>
    <div className={styles.page}>

      <section className={styles.clientListGrid}>
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
            <button
              type="button"
              className={`${styles.searchFilterToggle} ${(serviceFilter || categoryFilter || fundsStatusFilter) ? styles.searchFilterActive : ""}`}
              aria-label="Show filters"
              aria-expanded={filtersOpen}
              title="Filter clients"
              onClick={() => setFiltersOpen((open) => !open)}
            ><FiSliders /></button>
            <button type="submit">Search</button>
            {(activeSearch || serviceFilter || categoryFilter || fundsStatusFilter) && (
              <button type="button" onClick={clearSearch}>
                Clear
              </button>
            )}
          </form>

          {filtersOpen && <div className={styles.clientFilterCard}>
            <label>Category
              <select value={categoryInput} onChange={(event) => setCategoryInput(event.target.value)}>
                <option value="">All categories</option>
                <option value="tiktok">TikTok — DM & Landing Page</option>
                <option value="meta">Meta — DM & Landing Page</option>
              </select>
            </label>
            <label>Specific service
              <select value={serviceInput} onChange={(event) => setServiceInput(event.target.value)}>
                <option value="">All services</option>
                {serviceOptions.map((service) => <option key={service} value={service}>{service}</option>)}
              </select>
            </label>
            <label>Funds status
              <select value={fundsStatusInput} onChange={(event) => setFundsStatusInput(event.target.value)}>
                <option value="">All funds statuses</option>
                <option value="pending">Funds pending</option>
                <option value="sent">Funds sent</option>
                <option value="not_needed">Funds not needed</option>
              </select>
            </label>
            <p>Choose one or combine filters, then select Search.</p>
          </div>}

          <div className={styles.clientList}>
            {paginatedClients.map((client) => (
              <article
                key={client._id}
                className={styles.clientCard}
              >
                <div className={styles.clientTop}>
                  <div>
                    <ClientNameActions
                      name={client.businessName}
                      conversationId={client.inboxConversationId}
                      canOpenInbox={canAccessInbox(staff)}
                      onOpenInbox={openInbox}
                      onFilter={filterByClientName}
                    />
                    {staff?.admin === true && <DeleteClient kind="ads-clients" client={client} onDeleted={() => { setClients((items) => items.filter((item) => item._id !== client._id)); setCurrentPage(1); }} />}
                    <span>{client.servicePaidFor}</span>
                    <small className={styles.clientDate}>
                      Added {formatAddedDate(client.createdAt)}
                    </small>
                    <div className={styles.fundsPlacement}>
                      <FundsBadge client={client} editable={Boolean(staff?.admin)} saving={Boolean(fundsSaving[client._id])} onChange={(value) => changeFundsStatus(client, value)} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px", alignItems: "center" }}>
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
              <p className={styles.emptyState}>No ads clients have been added yet.</p>
            )}

            {clients.length > 0 && filteredClients.length === 0 && (
              <p className={styles.emptyState}>No ads client matched your search.</p>
            )}

            {filteredClients.length > PAGE_SIZE && (
              <div className={styles.pagination}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  type="button"
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
    </CrmLayout>
  );
}
