import { useEffect, useState } from "react";
import API from "../utils/api";
import styles from "../styles/Admin.module.css";

import { useRouter } from "next/router";

export default function Admin() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.push("/admin-login-0tT6Yc1");
    }
  }, []);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("today");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/booking/all");
      setBookings(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const cancelBooking = async (id) => {
    try {
      await API.put(`/booking/cancel/${id}`);
      fetchBookings();
    } catch (err) {
      console.log(err);
    }
  };

  const markCompleted = async (id) => {
    try {
      await API.put(`/booking/complete/${id}`);
      fetchBookings();
    } catch (err) {
      console.log(err);
    }
  };

  /* ---------------- DATE HELPERS ---------------- */
  const formatDate = (date) => {
    if (!date) return null;

    const d = new Date(date);

    if (isNaN(d.getTime())) return null;

    return d.toISOString().split("T")[0];
  };

  const today = formatDate(new Date());

  const tomorrowDate = (() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return formatDate(t);
  })();

  /* ---------------- METRICS ---------------- */

  const totalBookings = bookings.length;

  const todaysBookings = bookings.filter(
    (b) => b.date && formatDate(b.date) === today,
  );

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

  const todaysRevenue = todaysBookings.reduce(
    (sum, b) => sum + (b.price || 0),
    0,
  );

  /* ---------------- FILTER LOGIC ---------------- */
  let filteredBookings = [];

  if (filter === "today") {
    filteredBookings = bookings.filter(
      (b) => b.date && formatDate(b.date) === today,
    );
  }

  if (filter === "tomorrow") {
    filteredBookings = bookings.filter(
      (b) => b.date && formatDate(b.date) === tomorrowDate,
    );
  }

  if (filter === "upcoming") {
    filteredBookings = bookings.filter(
      (b) => b.date && formatDate(b.date) > today,
    );
  }

  if (filter === "past") {
    filteredBookings = bookings.filter(
      (b) => b.date && formatDate(b.date) < today,
    );
  }

  filteredBookings.sort((a, b) => {
    if (!a.time || !b.time) return 0;

    const convert = (t) => {
      let hour = parseInt(t);

      if (t.includes("pm") && hour !== 12) hour += 12;
      if (t.includes("am") && hour === 12) hour = 0;

      return hour;
    };

    return convert(a.time) - convert(b.time);
  });

  /* ---------------- SERVICE STATS ---------------- */

  const serviceStats = {};

  bookings.forEach((b) => {
    if (!serviceStats[b.serviceTitle]) {
      serviceStats[b.serviceTitle] = {
        count: 0,
        revenue: 0,
      };
    }

    serviceStats[b.serviceTitle].count += 1;
    serviceStats[b.serviceTitle].revenue += b.price || 0;
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Joshspot Media Dashboard</h1>

      {/* METRICS */}

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <span>Total Bookings</span>
          <h2>{totalBookings}</h2>
        </div>

        <div className={styles.metricCard}>
          <span>Today's Bookings</span>
          <h2>{todaysBookings.length}</h2>
        </div>

        <div className={styles.metricCard}>
          <span>Total Revenue</span>
          <h2>₦{totalRevenue.toLocaleString()}</h2>
        </div>

        <div className={styles.metricCard}>
          <span>Today's Revenue</span>
          <h2>₦{todaysRevenue.toLocaleString()}</h2>
        </div>
      </div>

      {/* JOB FILTERS */}

      <div className={styles.jobFilters}>
        <button
          className={`${styles.filterBtn} ${filter === "today" ? styles.active : ""}`}
          onClick={() => setFilter("today")}
        >
          Today's Jobs
        </button>

        <button
          className={`${styles.filterBtn} ${filter === "tomorrow" ? styles.active : ""}`}
          onClick={() => setFilter("tomorrow")}
        >
          Tomorrow
        </button>

        <button
          className={`${styles.filterBtn} ${filter === "upcoming" ? styles.active : ""}`}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </button>

        <button
          className={`${styles.filterBtn} ${filter === "past" ? styles.active : ""}`}
          onClick={() => setFilter("past")}
        >
          Past
        </button>
      </div>

      {/* JOB CARDS */}

      <div className={styles.jobsGrid}>
        {filteredBookings.map((b) => (
          <div key={b._id} className={styles.jobCard}>
            <div className={styles.jobHeader}>
              <h3>{b.serviceTitle}</h3>
              <span>{b.time}</span>
            </div>

            <div className={styles.jobBody}>
              <p>
                <strong>Name:</strong> {b.name}
              </p>
              <p>
                <strong>WhatsApp:</strong> {b.phone}
              </p>
              <p>
                <strong>Email:</strong> {b.email}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(b.date)}
              </p>
            </div>

            <div className={styles.actions}>
              {b.status !== "cancelled" && (
                <button
                  onClick={() => cancelBooking(b._id)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              )}

              {b.status !== "completed" && (
                <button
                  onClick={() => markCompleted(b._id)}
                  className={styles.completeBtn}
                >
                  Completed
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <p className={styles.noJobs}>No jobs found</p>
        )}
      </div>

      {/* BOOKINGS TABLE */}

      <div className={styles.tableCard}>
        <h2>All Bookings</h2>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Service</th>
              <th>Date</th>
              <th>Time</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {[...bookings]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((b) => (
                <tr key={b._id}>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>{b.phone}</td>
                  <td>{b.serviceTitle}</td>
                  <td>{formatDate(b.date)}</td>
                  <td>{b.time}</td>
                  <td>{b.notes || "-"}</td>
                  <td>{b.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* SERVICE PERFORMANCE */}

      <div className={styles.serviceStats}>
        <h2>Service Performance</h2>

        {Object.entries(serviceStats).map(([service, data]) => (
          <div key={service} className={styles.serviceRow}>
            <div>{service}</div>
            <div>{data.count} bookings</div>
            <div>₦{data.revenue.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
