import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import API from "../utils/api";
import styles from "../styles/Crm.module.css";
import DeleteClient from "../components/crm/DeleteClient";
import CrmLayout from "../components/crm/CrmLayout";
import ClientNameActions from "../components/crm/ClientNameActions";
import { canAccessInbox } from "../utils/inboxAccess";
import { FiSliders } from "react-icons/fi";

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

const serviceOptions = [
  "Meta ads setup",
  "TikTok ads setup - DM",
  "Tiktok Ads Setup - Landing Page",
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

export default function CrmDashboard() {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [clients, setClients] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
      return matchesName && matchesSearch && matchesService && matchesCategory;
    });
  }, [activeSearch, categoryFilter, clients, nameFilter, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredClients.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredClients]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await API.get("/crm/clients");

      setClients(res.data.clients);
      setCurrentPage(1);
      return res.data.clients;
    } catch {
      localStorage.removeItem("crmToken");
      localStorage.removeItem("crmStaff");
      router.push("/crm-login");
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
    setCategoryFilter(categoryInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setNameFilter("");
    setServiceFilter("");
    setCategoryFilter("");
    setServiceInput("");
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

  const logout = () => {
    if (staff?.admin) { localStorage.removeItem("adminToken"); router.push("/admin-login-0tT6Yc1"); return; }
    localStorage.removeItem("crmToken");
    localStorage.removeItem("crmStaff");
    router.push("/crm-login");
  };

  return (
    <CrmLayout active="setup" staff={staff} onLogout={logout}>
    <div className={styles.page}>

      <section className={styles.clientListGrid}>
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
            <button
              type="button"
              className={`${styles.searchFilterToggle} ${(serviceFilter || categoryFilter) ? styles.searchFilterActive : ""}`}
              aria-label="Show filters"
              aria-expanded={filtersOpen}
              title="Filter clients"
              onClick={() => setFiltersOpen((open) => !open)}
            ><FiSliders /></button>
            <button type="submit">Search</button>
            {(activeSearch || serviceFilter || categoryFilter) && (
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
                <option value="meta">Meta — all setup records</option>
              </select>
            </label>
            <label>Specific service
              <select value={serviceInput} onChange={(event) => setServiceInput(event.target.value)}>
                <option value="">All services</option>
                {serviceOptions.map((service) => <option key={service} value={service}>{service}</option>)}
              </select>
            </label>
            <p>Choose one or combine both, then select Search.</p>
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
                    {staff?.admin === true && <DeleteClient kind="clients" client={client} onDeleted={() => { setClients((items) => items.filter((item) => item._id !== client._id)); setCurrentPage(1); }} />}
                    <span>{client.servicePaidFor}</span>
                    <small className={styles.clientDate}>
                      Added {formatAddedDate(client.createdAt)}
                    </small>
                  </div>
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
