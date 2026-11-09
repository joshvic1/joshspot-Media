import AdminLayout from "../../components/admin/AdminLayout";
import RecordsBrowser from "../../components/admin/RecordsBrowser";
import Reports from "../../components/admin/Reports";
import CoursePayments from "../../components/admin/CoursePayments";
import SourceAnalytics from "../../components/admin/SourceAnalytics";
import TelegramAccess from "../../components/admin/TelegramAccess";
export default function AdminSection({ section }) {
  return <AdminLayout active={section}>{section === "telegram-access" ? <TelegramAccess /> : section === "sources" ? <SourceAnalytics /> : section === "courses" ? <CoursePayments /> : ["invoices","performance"].includes(section) ? <Reports mode={section} /> : <RecordsBrowser key={section} view={section} />}</AdminLayout>;
}
export function getStaticPaths() {
  return { paths: ["courses", "sources", "telegram-access", "invoices", "bookings", "schedule", "leads", "performance"].map((section) => ({ params: { section } })), fallback: false };
}
export function getStaticProps({ params }) { return { props: { section: params.section } }; }
