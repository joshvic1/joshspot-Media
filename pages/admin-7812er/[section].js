import AdminLayout from "../../components/admin/AdminLayout";
import AdminRecords from "../../components/admin/AdminRecords";
import CoursePayments from "../../components/admin/CoursePayments";
export default function AdminSection({ section }) {
  return <AdminLayout active={section}>{section === "courses" ? <CoursePayments /> : <AdminRecords view={section} />}</AdminLayout>;
}
export function getStaticPaths() {
  return { paths: ["courses", "bookings", "schedule", "leads", "performance"].map((section) => ({ params: { section } })), fallback: false };
}
export function getStaticProps({ params }) { return { props: { section: params.section } }; }
