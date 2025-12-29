"use client"

import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type Order = {
  id: string
  status: string
  payment_status: string
  total_price: number
  currency: string
  created_at: string
}

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setOrders([])
        setLoading(false)
        return
      }
      const res = await fetch('/api/marketplace/orders', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      setOrders(json.orders || json || [])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4 pb-20 lg:pb-4">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
        {loading ? (
          <Card><CardContent className="p-6">Loading...</CardContent></Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(o => (
              <Card key={o.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Order #{o.id}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{new Date(o.created_at).toLocaleString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm">Status: <span className="font-medium capitalize">{o.status}</span></div>
                    <div className="text-sm">Payment: <span className="font-medium capitalize">{o.payment_status}</span></div>
                    <div className="text-sm">Total: <span className="font-medium">${(o.total_price || 0).toFixed(2)} {o.currency || 'USD'}</span></div>
                  </div>
                  <Button asChild>
                    <Link href={`/marketplace/orders/${o.id}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}