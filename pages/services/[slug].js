import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { FiArrowLeft, FiArrowUpRight, FiCheck, FiLock } from "react-icons/fi";
import { services } from "../../config/services";
import PublicLayout from "../../components/PublicLayout";
import BookingModal from "../../components/BookingModal/BookingModal";
import ShareService from "../../components/ShareService";
import styles from "../../styles/Public.module.css";
export default function ServicePage({slug}) {
const service=services.find(item=>item.slug===slug);
const [booking,setBooking]=useState(false); const Icon=service.icon;
const price=service.priceLabel || service.priceRange || "₦"+service.price.toLocaleString("en-NG");
return <PublicLayout title="Find the right support for your business"><Head><title>{service.title} | Joshspot Media</title><meta name="description" content={service.description} /><meta property="og:title" content={service.title+" | Joshspot Media"} /><meta property="og:description" content={service.description} /></Head>
<Link href={service.resource ? "/#learn" : "/#services"} className={styles.back}><FiArrowLeft /> All services & resources</Link>
<section className={styles.detailGrid}><div className={styles.detailMain}><span className={styles.serviceIcon}><Icon /></span><span className={styles.eyebrow}>{service.eyebrow}</span><h1>{service.title}</h1><p className={styles.detailIntro}>{service.description}</p><h2>What’s included</h2><ul className={styles.included}>{service.highlights.map(item=><li key={item}><FiCheck />{item}</li>)}</ul>{service.options && <><h2>Choose the support that fits</h2><div className={styles.packageList}>{service.options.map(option=><div key={option.label}><span>{option.label}</span><strong>₦{option.price.toLocaleString("en-NG")}</strong></div>)}</div></>}<div className={styles.detailNext}><h2>{service.resource ? "Start with something practical" : "Ready for your next step?"}</h2><p>{service.externalLink?.startsWith("/") ? "Click Book service to visit the script page and complete your payment there." : service.resource ? "Open this resource and learn at your own pace. You can save or share this page to come back to it." : "Click Book service, select your package where available, and enter your name, email and WhatsApp number. You’ll then continue to Paystack to complete payment."}</p></div></div>
<aside className={styles.bookingCard}><span className={styles.tag}>{service.resource ? "FREE RESOURCE" : "YOUR NEXT STEP"}</span><h2>{service.resource ? "Start learning today." : "Let’s get you started."}</h2><strong className={styles.detailPrice}>{price}</strong><p>{service.resource ? "Explore practical marketing advice and training." : "View the options, then book the support your business needs."}</p>{service.externalLink ? <a className={styles.primary} href={service.externalLink} target={service.externalLink.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">{service.ctaLabel} <FiArrowUpRight /></a> : <button className={styles.primary} onClick={()=>setBooking(true)}>Book service <FiArrowUpRight /></button>}{!service.resource && <small><FiLock /> Secure payment with Paystack</small>}<div className={styles.detailShare}><span>Save it for later? Copy the link.</span><ShareService service={service} /></div></aside></section>
{booking && <BookingModal service={service} closeModal={()=>setBooking(false)} />}</PublicLayout>;
}
export function getStaticPaths(){ return {paths:services.map(service=>({params:{slug:service.slug}})),fallback:"blocking"}; }
export function getStaticProps({params}){ if (!services.some(service => service.slug === params.slug)) return {notFound:true}; return {props:{slug:params.slug}}; }
