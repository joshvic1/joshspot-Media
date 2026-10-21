import Link from 'next/link';
import PublicLayout from '../../components/PublicLayout';
import ServiceCard from '../../components/ServiceCard/ServiceCard';
import { services } from '../../config/services';
import styles from '../../styles/Public.module.css';
export default function Services() {
  return <PublicLayout><section className={styles.section}>
    <div className={styles.sectionHeading}><div><h1>Advertising support, your way.</h1><p>Work with Josh and the team, or learn to run your own campaigns.</p></div></div>
    <h2>Services & private coaching</h2><div className={styles.serviceGrid}>{services.filter(s => !s.resource).map(service => <ServiceCard key={service.id} service={service} />)}</div>
    <h2>Learn at your own pace</h2><p>Explore the <Link href="/course">TikTok, Facebook and Instagram course</Link> or <Link href="/whatsapp">WhatsApp Status ads training</Link>.</p>
    <div className={styles.resourceGrid}>{services.filter(s => s.resource).map(service => <ServiceCard key={service.id} service={service} />)}</div>
  </section></PublicLayout>;
}
