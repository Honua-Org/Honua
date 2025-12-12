import { Metadata } from 'next'
import { SellerDashboard } from '@/components/marketplace/seller-dashboard'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Seller Dashboard - Honua Social',
  description: 'Manage your marketplace products, inventory, and sales performance'
}

export default async function SellerDashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login?redirect=/marketplace/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Seller Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your products, track performance, and grow your business
        </p>
      </div>
      
      <SellerDashboard />
    </div>
  )
}
