import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import API from "../utils/api";
import styles from "@/styles/PickADate.module.css";

export default function PickADate() {
  const router = useRouter();
  const { token } = router.query;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(1);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());
  const [day, setDay] = useState(null);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());

  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const timeSlots = [
    "6am",
    "7am",
    "8am",
    "9am",
    "10am",
    "11am",
    "12pm",
    "1pm",
    "2pm",
    "3pm",
    "4pm",
    "5pm",
    "6pm",
    "7pm",
    "8pm",
    "9pm",
    "10pm",
    "11pm",
  ];

  const [bookedTimes, setBookedTimes] = useState([]);
  const firePurchaseEvent = () => {
    if (typeof window === "undefined") return;

    const tracked = localStorage.getItem("tiktok_purchase_tracked");

    if (tracked) {
      console.log("⚠️ purchase already tracked");
      return;
    }

    console.log("🔥 purchase event fired");

    if (window.ttq) {
      window.ttq.track("Purchase", {
        value: 20000,
        currency: "NGN",
        event_id: token,
        contents: [
          {
            content_name: "TikTok Ads Account Setup",
            content_type: "service",
            price: 20000,
          },
        ],
      });

      console.log("✅ TikTok purchase event sent");

      localStorage.setItem("tiktok_purchase_tracked", "true");
    } else {
      console.log("❌ TikTok Pixel not found");
    }
  };
  useEffect(() => {
    if (!token) return;

    firePurchaseEvent();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    verifyBooking();
  }, [token]);

  const verifyBooking = async () => {
    try {
      const res = await API.get(`/booking/verify/${token}`);

      setBooking(res.data);

      if (res.data.date) {
        setStep(5);
      }
    } catch {
      alert("Invalid booking link");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async (date) => {
    try {
      const res = await API.get(`/booking/slots/${date}`);

      setBookedTimes(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const finishBooking = async () => {
    try {
      await API.post("/booking/complete", {
        token,
        date: selectedDate,
        time: selectedTime,
        notes,
      });

      // update booking state instantly
      setBooking((prev) => ({
        ...prev,
        date: selectedDate,
        time: selectedTime,
        notes: notes,
      }));

      setStep(5);
    } catch {
      alert("Booking failed");
    }
  };

  if (loading) {
    return <p className={styles.loading}>Loading...</p>;
  }

  if (!booking) {
    return <p className={styles.loading}>Invalid booking</p>;
  }
  const dateConfig = {
    month: {
      format: "MM",
      caption: "Month",
      step: 1,
    },
    date: {
      format: "DD",
      caption: "Day",
      step: 1,
    },
  };

  const minDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => {
    if (month === currentMonth) {
      return d >= currentDay + 1;
    }

    return true;
  });
  const isWithin24Hours = (selectedDate, time) => {
    if (!selectedDate) return false;

    const [hour] = time.replace("am", "").replace("pm", "").split(":");

    let hourNumber = parseInt(hour);

    if (time.includes("pm") && hourNumber !== 12) {
      hourNumber += 12;
    }

    if (time.includes("am") && hourNumber === 12) {
      hourNumber = 0;
    }

    const slotDate = new Date(selectedDate);

    slotDate.setHours(hourNumber);

    const now = new Date();

    const diffHours = (slotDate - now) / (1000 * 60 * 60);

    return diffHours < 24;
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* STEP 1 */}

        {step === 1 && (
          <div className={styles.step}>
            <h1 className={styles.title}>✓Booking Successful</h1>

            <p className={styles.subtitle}>
              Please confirm your booking details. Then click "Next" to select
              your preferred date and time for the consultation.
            </p>

            <div className={styles.infoBox}>
              <span>Name</span>
              <p>{booking.name}</p>
            </div>

            <div className={styles.infoBox}>
              <span>Email</span>
              <p>{booking.email}</p>
            </div>

            <div className={styles.infoBox}>
              <span>WhatsApp</span>
              <p>{booking.phone}</p>
            </div>

            <div className={styles.infoBox}>
              <span>Service</span>
              <p>{booking.serviceTitle}</p>
            </div>

            <button className={styles.primaryBtn} onClick={() => setStep(2)}>
              Next →
            </button>
          </div>
        )}

        {/* STEP 2 */}

        {step === 2 && (
          <div className={styles.step}>
            <h1 className={styles.title}>Select Date & Time</h1>
            <p className={styles.subtitle}>Please select a date</p>
            <div className={styles.datePicker}>
              <div className={styles.column}>
                {days.map((d) => {
                  const isPast = month === currentMonth && d < currentDay;

                  return (
                    <div
                      key={d}
                      className={`${styles.option}
${day === d ? styles.selected : ""}
${isPast ? styles.disabled : ""}
`}
                      onClick={() => {
                        setDay(d);

                        const selected = new Date(currentYear, month, d);

                        const formatted = selected.toISOString().split("T")[0];

                        setSelectedDate(formatted);

                        setSelectedTime("");

                        fetchBookedSlots(formatted);
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              <div className={styles.column}>
                {months.map((m, i) => (
                  <div
                    key={m}
                    className={`${styles.option}
${month === i ? styles.selected : ""}
`}
                    onClick={() => {
                      setMonth(i);

                      setDay(null);

                      setSelectedDate("");
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            <h3 className={styles.sectionTitle}>Available Time</h3>
            <p className={styles.subtitle}>
              Please select any of the available time slots
            </p>
            <div className={styles.times}>
              {timeSlots.map((time) => {
                const isBooked = bookedTimes.includes(time);

                const blockedBy24hr = isWithin24Hours(selectedDate, time);

                return (
                  <button
                    key={time}
                    className={`${styles.timeBtn}
${selectedTime === time ? styles.active : ""}
${isBooked || blockedBy24hr ? styles.booked : ""}
`}
                    onClick={() => {
                      if (isBooked) {
                        alert("This time has already been booked.");
                        return;
                      }

                      if (blockedBy24hr) {
                        alert(
                          "These time slots are booked out already.Please select another available date/time",
                        );
                        return;
                      }

                      setSelectedTime(time);
                    }}
                  >
                    {isBooked
                      ? `✖ ${time}`
                      : blockedBy24hr
                        ? `⛔ ${time}`
                        : time}
                  </button>
                );
              })}
            </div>
            {bookedTimes.length === timeSlots.length && (
              <p className={styles.fullBooked}>
                All time slots for this day have been booked. Please select
                another date.
              </p>
            )}
            <div className={styles.buttons}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>
                Back
              </button>

              <button
                className={styles.primaryBtn}
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}

        {step === 3 && (
          <div className={styles.step}>
            <h1 className={styles.title}>Additional Notes</h1>

            <p className={styles.subtitle}>
              Any message for Joshspot Media (optional)
            </p>

            <textarea
              className={styles.notes}
              placeholder="Write any details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className={styles.buttons}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>
                Back
              </button>

              <button className={styles.primaryBtn} onClick={() => setStep(4)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}

        {step === 4 && (
          <div className={styles.step}>
            <h1 className={styles.title}>Booking Summary</h1>

            <div className={styles.summaryBox}>
              <p>
                <strong>Date:</strong> {selectedDate}
              </p>

              <p>
                <strong>Time:</strong> {selectedTime}
              </p>

              <p>
                <strong>Notes:</strong> {notes || "None"}
              </p>
            </div>

            <div className={styles.buttons}>
              <button className={styles.backBtn} onClick={() => setStep(3)}>
                Back
              </button>

              <button className={styles.primaryBtn} onClick={finishBooking}>
                Finish Booking →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 */}

        {step === 5 && (
          <div className={styles.step}>
            <div className={styles.successIcon}>✓</div>

            <h1 className={styles.title}>Booking Confirmed</h1>

            <p className={styles.subtitle}>
              You will be contacted by the Joshspot Media team on the booked
              date and time. Please be available and reachable on WhatsApp at
              the booked time. Thank you!
            </p>

            <div className={styles.detailsCard}>
              <h3 className={styles.detailsTitle}>Booking Details</h3>

              <div className={styles.detailRow}>
                <span>Name</span>
                <p>{booking.name}</p>
              </div>

              <div className={styles.detailRow}>
                <span>Email</span>
                <p>{booking.email}</p>
              </div>

              <div className={styles.detailRow}>
                <span>WhatsApp</span>
                <p>{booking.phone}</p>
              </div>

              <div className={styles.detailRow}>
                <span>Date</span>
                <p>
                  {new Date(booking.date).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className={styles.detailRow}>
                <span>Time</span>
                <p>{booking.time}</p>
              </div>

              <div className={styles.detailRow}>
                <span>Notes</span>
                <p>{booking.notes || "None"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
