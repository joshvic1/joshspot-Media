import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BookingModal from "../BookingModal/BookingModal";
import ViewDetailsModal from "../ViewDetailsModal/ViewDetailsModal";
import ShareService from "../ShareService";
import styles from "../../styles/Public.module.css";
export default function ServiceCard({ service }) {
const [showDetails,setShowDetails]=useState(false);
const [showBooking,setShowBooking]=useState(false);
const summaries = {
  1: "Discuss your ads or business growth with Josh and get clear direction.",
  2: "We’ll log in and find out why your ads or account settings aren’t working.",
  3: "Get your TikTok or Meta ads account ready to launch.",
  4: "Three days with Josh, one hour per day. Learn to run your own ads.",
  8: "Your video or voiceover script, written word for word to grab attention.",
  9: "A one-minute video of Josh talking about your product or service.",
  5: "Marketing ideas and practical advice for your business.",
  6: "Learn the basics of running TikTok ads, for free.",
  7: "Start learning Meta campaigns, targeting and setup.",
};
const price=service.priceLabel || service.priceRange || "₦"+service.price.toLocaleString("en-NG");
function openService() { if(service.externalLink?.startsWith("/")) window.location.assign(service.externalLink); else if(service.externalLink) window.open(service.externalLink,"_blank","noopener,noreferrer"); else setShowBooking(true); }
return <><article className={styles.imageServiceCard} data-tone={service.id}>
<div className={styles.servicePhoto}><Image src={service.image} alt={service.title} fill sizes="(max-width:650px) 100vw, (max-width:1000px) 50vw, 33vw" /></div>
<div className={styles.imageCardBody}>
<div className={styles.imageCardTitle}><h3><Link href={"/services/"+service.slug}>{service.title}</Link></h3><span>{price}</span></div>
<p>{summaries[service.id] || service.description}</p>
<div className={styles.imageCardMeta}><button type="button" onClick={()=>setShowDetails(true)}>View details</button><ShareService service={service} /></div>
<button type="button" className={styles.imageCardBook} onClick={openService}>{service.ctaLabel || "Book service"}</button>
</div>
</article>{showDetails && <ViewDetailsModal service={service} closeModal={()=>setShowDetails(false)} openBooking={openService} />}{showBooking && <BookingModal service={service} closeModal={()=>setShowBooking(false)} />}</>;
}
