import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Package, Users, ShoppingCart, Settings, LogOut } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  // In a real app, you'd check if the user has admin privileges
  // For now, we'll assume all authenticated users are admins

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                View Store
              </Link>
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Admin Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Package className="w-4 h-4 mr-3" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/products"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Package className="w-4 h-4 mr-3" />
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/orders"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <ShoppingCart className="w-4 h-4 mr-3" />
                    Orders
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/customers"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Users className="w-4 h-4 mr-3" />
                    Customers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Admin Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
