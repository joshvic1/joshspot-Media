import AdminLayout from "../components/admin/AdminLayout";
import AdminRecords from "../components/admin/AdminRecords";
export default function AdminOverview() {
  return <AdminLayout active="overview"><AdminRecords view="overview" /></AdminLayout>;
}
