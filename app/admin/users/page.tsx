import AdminUsersClient from "@/components/admin/AdminUsersClient"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Users</h2>
      </div>
      <AdminUsersClient />
    </div>
  )
}
