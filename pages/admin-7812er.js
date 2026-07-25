import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "../utils/api";
import styles from "../styles/Admin.module.css";

const formatDate = (date) => {
  if (!date) return null;

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString().split("T")[0];
};

const formatMoney = (amount) => `NGN ${Number(amount || 0).toLocaleString()}`;

export default function Admin() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("today");

  const fetchBookings = useCallback(async () => {
    try {
      const res = await API.get("/booking/all");
      setBookings(res.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.push("/admin-login-0tT6Yc1");
      return;
    }

    const timer = setTimeout(fetchBookings, 0);

    return () => clearTimeout(timer);
  }, [fetchBookings, router]);

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

  const today = formatDate(new Date());

  const tomorrowDate = (() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return formatDate(t);
  })();

  const todaysBookings = bookings.filter(
    (booking) => booking.date && formatDate(booking.date) === today,
  );

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + (booking.price || 0),
    0,
  );

  const todaysRevenue = todaysBookings.reduce(
    (sum, booking) => sum + (booking.price || 0),
    0,
  );

  const filteredBookings = bookings
    .filter((booking) => {
      const bookingDate = booking.date && formatDate(booking.date);

      if (filter === "today") return bookingDate === today;
      if (filter === "tomorrow") return bookingDate === tomorrowDate;
      if (filter === "upcoming") return bookingDate && bookingDate > today;
      if (filter === "past") return bookingDate && bookingDate < today;

      return true;
    })
    .sort((a, b) => {
      if (!a.time || !b.time) return 0;

      const convert = (time) => {
        let hour = parseInt(time, 10);

        if (time.includes("pm") && hour !== 12) hour += 12;
        if (time.includes("am") && hour === 12) hour = 0;

        return hour;
      };

      return convert(a.time) - convert(b.time);
    });

  const serviceStats = {};

  bookings.forEach((booking) => {
    const title = booking.serviceTitle || "Untitled service";

    if (!serviceStats[title]) {
      serviceStats[title] = {
        count: 0,
        revenue: 0,
      };
    }

    serviceStats[title].count += 1;
    serviceStats[title].revenue += booking.price || 0;
  });

  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const getPackage = (booking) =>
    booking.packageSelected || booking.duration || "-";

  return (
    <div className={styles.page}>
      <header className={styles.dashboardHeader}>
        <div>
          <span className={styles.kicker}>Admin dashboard</span>
          <h1 className={styles.title}>Joshspot Media Bookings</h1>
          <p>Track payments, packages, booked dates, and client details.</p>
        </div>
      </header>

      <section className={styles.metrics}>
        <div className={styles.metricCard}>
          <span>Total Bookings</span>
          <h2>{bookings.length}</h2>
        </div>

        <div className={styles.metricCard}>
          <span>Today&apos;s Bookings</span>
          <h2>{todaysBookings.length}</h2>
        </div>

        <div className={styles.metricCard}>
          <span>Total Revenue</span>
          <h2>{formatMoney(totalRevenue)}</h2>
        </div>

        <div className={styles.metricCard}>
          <span>Today&apos;s Revenue</span>
          <h2>{formatMoney(todaysRevenue)}</h2>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.kicker}>Schedule</span>
            <h2>Jobs by Date</h2>
          </div>
          <div className={styles.jobFilters}>
            {["today", "tomorrow", "upcoming", "past"].map((item) => (
              <button
                key={item}
                className={`${styles.filterBtn} ${
                  filter === item ? styles.active : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.jobsGrid}>
          {filteredBookings.map((booking) => (
            <div key={booking._id} className={styles.jobCard}>
              <div className={styles.cardTop}>
                <span className={styles.status}>{booking.status}</span>
                <strong>{booking.time || "No time yet"}</strong>
              </div>
              <h3>{booking.serviceTitle}</h3>
              <div className={styles.infoGrid}>
                <p>
                  <span>Name</span>
                  <strong>{booking.name}</strong>
                </p>
                <p>
                  <span>WhatsApp</span>
                  <strong>{booking.phone}</strong>
                </p>
                <p>
                  <span>Date</span>
                  <strong>{formatDate(booking.date) || "Not selected"}</strong>
                </p>
                <p>
                  <span>Package</span>
                  <strong>{getPackage(booking)}</strong>
                </p>
              </div>

              <div className={styles.actions}>
                {booking.status !== "cancelled" && (
                  <button
                    onClick={() => cancelBooking(booking._id)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                )}

                {booking.status !== "completed" && (
                  <button
                    onClick={() => markCompleted(booking._id)}
                    className={styles.completeBtn}
                  >
                    Completed
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <p className={styles.emptyState}>No jobs found for this filter.</p>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.kicker}>All records</span>
            <h2>All Bookings</h2>
          </div>
          <span className={styles.recordCount}>{bookings.length} records</span>
        </div>

        <div className={styles.bookingsGrid}>
          {sortedBookings.map((booking) => (
            <article key={booking._id} className={styles.bookingCard}>
              <div className={styles.bookingHeader}>
                <div>
                  <span className={styles.serviceId}>
                    Service #{booking.serviceId}
                  </span>
                  <h3>{booking.serviceTitle}</h3>
                </div>
                <span className={styles.status}>{booking.status}</span>
              </div>

              <div className={styles.bookingBody}>
                <p>
                  <span>Name</span>
                  <strong>{booking.name}</strong>
                </p>
                <p>
                  <span>Email</span>
                  <strong>{booking.email}</strong>
                </p>
                <p>
                  <span>WhatsApp</span>
                  <strong>{booking.phone}</strong>
                </p>
                <p>
                  <span>Package</span>
                  <strong>{getPackage(booking)}</strong>
                </p>
                <p>
                  <span>Amount Paid</span>
                  <strong>{formatMoney(booking.price)}</strong>
                </p>
                <p>
                  <span>Payment</span>
                  <strong>{booking.paid ? "Paid" : "Pending date selection"}</strong>
                </p>
                <p>
                  <span>Date</span>
                  <strong>{formatDate(booking.date) || "-"}</strong>
                </p>
                <p>
                  <span>Time</span>
                  <strong>{booking.time || "-"}</strong>
                </p>
                <p className={styles.fullWidth}>
                  <span>Notes</span>
                  <strong>{booking.notes || "-"}</strong>
                </p>
              </div>

              <div className={styles.bookingActions}>
                {booking.status !== "cancelled" && (
                  <button
                    onClick={() => cancelBooking(booking._id)}
                    className={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                )}

                {booking.status !== "completed" && (
                  <button
                    onClick={() => markCompleted(booking._id)}
                    className={styles.completeBtn}
                  >
                    Completed
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.kicker}>Performance</span>
            <h2>Service Performance</h2>
          </div>
        </div>

        <div className={styles.serviceStats}>
          {Object.entries(serviceStats).map(([service, data]) => (
            <div key={service} className={styles.serviceRow}>
              <strong>{service}</strong>
              <span>{data.count} bookings</span>
              <span>{formatMoney(data.revenue)}</span>
            </div>
          ))}

          {Object.keys(serviceStats).length === 0 && (
            <p className={styles.emptyState}>No service data yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
