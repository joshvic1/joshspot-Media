import { useEffect, useState } from "react";
import { FiChevronLeft, FiMoreVertical, FiVolumeX, FiMessageCircle, FiArrowRight } from "react-icons/fi";
import styles from "../styles/WhatsAppCourse.module.css";

const ads = [
  { name: "Glow Studio", image: "/images/status-makeup.png", alt: "Makeup artist demonstrating makeup application" },
  { name: "Zevy Thrift", image: "/images/status-thrift.png", alt: "Thrift seller opening a bale of clothes" },
  { name: "Vista Homes", image: "/images/status-estate.png", alt: "Aerial view of a residential estate" },
];
export default function StatusAdPreview() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive(value => (value + 1) % ads.length), 4500);
    return () => window.clearInterval(timer);
  }, [paused]);
  const ad = ads[active];
  return <div className={styles.adPreviewWrap}>
    <h2 className={styles.previewHeading}>This is how your advert will look like</h2>
    <div className={styles.statusVisual}>
      <div className={styles.statusPhone}>
        <div className={styles.statusBars}>{ads.map((item, index) => <i key={item.name} style={{ background: index === active ? "#fff" : "#69736c" }} />)}</div>
        <div className={styles.statusHeader}><FiChevronLeft /><img className={styles.brandAvatar} src={ad.image} alt="" /><div><strong>{ad.name}</strong><small>Sponsored</small></div><FiVolumeX /><FiMoreVertical /></div>
        <div className={styles.adCarousel}><div className={styles.adTrack} style={{ transform: `translateX(-${active * 100}%)` }}>{ads.map(item => <img key={item.image} src={item.image} alt={item.alt} aria-hidden={item !== ad} />)}</div></div>
        <div className={styles.statusFooter}><span><FiMessageCircle /> Chat on WhatsApp <FiArrowRight /></span></div>
      </div>
      <div className={styles.adControls}>{ads.map((item, index) => <button key={item.name} type="button" aria-label={`Show ${item.name} advert`} aria-pressed={index === active} onClick={() => { setActive(index); setPaused(true); }} />)}<button className={styles.adPause} type="button" onClick={() => setPaused(value => !value)}>{paused ? "Resume" : "Pause"}</button></div>
    </div>
  </div>;
}
