'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Package, Truck, MapPin, Calendar, CreditCard, Coins } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Order {
  id: string
  product_id: string
  buyer_id: string
  seller_id: string
  quantity: number
  unit_price: number
  total_price: number
  currency: string
  green_points_used: number
  payment_method: string
  payment_status: string
  order_status: string
  shipping_address: any
  notes: string
  created_at: string
  updated_at: string
  product: {
    id: string
    title: string
    description: string
    price: number
    currency: string
    green_points_price: number
    type: string
    category: string
    images: string[]
    seller_profile: {
      id: string
      username: string
      full_name: string
      avatar_url: string
    }
  }
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/marketplace/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        toast.error('Failed to load order details')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('An error occurred while loading order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Order Confirmed</h1>
          </div>
          <p className="text-gray-600">Order #{order.id}</p>
          <p className="text-sm text-gray-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {order.product.images && order.product.images.length > 0 && (
                    <img 
                      src={order.product.images[0]} 
                      alt={order.product.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{order.product.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{order.product.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Quantity: {order.quantity}</span>
                      <span>•</span>
                      <span>Category: {order.product.category}</span>
                      <span>•</span>
                      <span>Type: {order.product.type}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {order.product.seller_profile.avatar_url && (
                    <img 
                      src={order.product.seller_profile.avatar_url} 
                      alt={order.product.seller_profile.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{order.product.seller_profile.full_name || order.product.seller_profile.username}</p>
                    <p className="text-gray-600 text-sm">@{order.product.seller_profile.username}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p>{order.shipping_address.street}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                    <p>{order.shipping_address.country}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Order Status</span>
                    <Badge className={getStatusColor(order.order_status)}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Payment Status</span>
                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Unit Price</span>
                  <span>{order.currency} {order.unit_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quantity</span>
                  <span>{order.quantity}</span>
                </div>
                {order.green_points_used > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      Green Points Used
                    </span>
                    <span>{order.green_points_used} GP</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {order.total_price > 0 && `${order.currency} ${order.total_price.toFixed(2)}`}
                    {order.green_points_used > 0 && order.total_price === 0 && `${order.green_points_used} GP`}
                    {order.green_points_used > 0 && order.total_price > 0 && ` + ${order.green_points_used} GP`}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Payment Method: {order.payment_method === 'green_points' ? 'Green Points' : 'Credit Card'}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Link href={`/marketplace/product/${order.product_id}`}>
                <Button variant="outline" className="w-full">
                  View Product
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}