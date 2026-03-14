import { useEffect } from "react";

export default function Success() {
  useEffect(() => {
    if (window.ttq) {
      window.ttq.track("Purchase", {
        value: 20000,
        currency: "NGN",
      });
    }
  }, []);

  return (
    <div style={{ padding: "100px", textAlign: "center" }}>
      <h1>Payment Successful</h1>
      <p>Message me here 07072571740.</p>
    </div>
  );
}
