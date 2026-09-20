import Head from "next/head";
import HomeHero from "../components/HomeHero";
import Link from "next/link";
import { FiArrowRight, FiBookOpen } from "react-icons/fi";
import PublicLayout from "../components/PublicLayout";
import ServiceCard from "../components/ServiceCard/ServiceCard";
import { services } from "../config/services";
import styles from "../styles/Public.module.css";
export default function Home() {
return <PublicLayout hero={<HomeHero />}>
<Head><title>Joshspot Media | Your next move in business</title><meta name="description" content="Practical marketing support from Joshspot Media. Book consultations, ads account audits, account setup and private training, or learn at your own pace." /></Head>

<section id="services" className={styles.section}><div className={styles.sectionHeading}><div><h2>What do you need help with?</h2><p>Explore the details, choose your service, and book right here.</p></div><span className={styles.count}>06 services</span></div><div className={styles.serviceGrid}>{services.filter(s=>!s.resource).map(service=><ServiceCard key={service.id} service={service} />)}</div></section>
<section className={styles.fullWidthSteps} aria-labelledby="steps-title"><div className={styles.steps}><div><h2 id="steps-title">Ready? Here’s how to book.</h2></div><ol><li><span>01</span><div><strong>Pick what you need</strong><p>See a service you need? Click View details to know what you’re getting.</p></div></li><li><span>02</span><div><strong>Tell us who you are</strong><p>Click Book service, choose your option and fill in your details.</p></div></li><li><span>03</span><div><strong>Make your payment</strong><p>Complete your payment and follow the next steps. Let’s get to work.</p></div></li></ol></div></section>
<section id="learn" className={styles.section}><div className={styles.sectionHeading}><div><h2>Get our paid training tutorial</h2><p>Watch, follow along and learn how to run your own ads.</p></div><FiBookOpen className={styles.sectionIcon} /></div><div className={styles.courseGrid}><Link href="/course" className={styles.courseTile}><span className={styles.tag}>SELF-PACED COURSE</span><h3>TikTok + Facebook + Instagram ads training</h3><p>Three in one course.</p><strong className={styles.trainingPrice}>₦8,000</strong><span className={styles.trainingLink}>Get the course <FiArrowRight /></span></Link><Link href="/whatsapp" className={styles.courseTile}><span className={styles.tag}>SELF-PACED COURSE</span><h3>WhatsApp TikTok Ads training</h3><p>Learn how to run ads for your business.</p><strong className={styles.trainingPrice}>₦10,000</strong><span className={styles.trainingLink}>Get the course <FiArrowRight /></span></Link></div><div className={styles.resourceHeading}><h3>Watch my free training</h3></div><div className={styles.resourceGrid}>{services.filter(s=>s.resource).map(service=><ServiceCard key={service.id} service={service} />)}</div></section>
</PublicLayout>;
}
