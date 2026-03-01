import { AdminPanel } from "@/components/admin/admin-panel";
import { requireAdminPage } from "@/lib/auth";

export default async function AdminPage() {
  const session = await requireAdminPage();
  return <AdminPanel username={session.username} />;
}
