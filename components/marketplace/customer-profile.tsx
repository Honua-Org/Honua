'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  Star,
  TrendingUp,
  Package,
  MessageSquare,
  Heart,
  Eye,
  Loader2
} from 'lucide-react'
import { useCustomerData } from '@/hooks/use-customer-data'

interface CustomerProfileProps {
  customerId: string
  sellerId: string
  onBack: () => void
}

export function CustomerProfile({ customerId, sellerId, onBack }: CustomerProfileProps) {
  const { customers, customerAnalytics, purchaseHistory, loading, error, selectedCustomer, selectCustomer } = useCustomerData(sellerId)

  // Select the customer when component mounts or customerId changes
  React.useEffect(() => {
    if (customerId && customerId !== selectedCustomer?.id) {
      const customer = customers.find((c: any) => c.customer_id === customerId)
      if (customer) {
        selectCustomer(customer)
      }
    }
  }, [customerId, selectedCustomer?.id, selectCustomer, customers])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading customer profile...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading customer profile</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customer List
          </Button>
        </div>
      </div>
    )
  }

  if (!selectedCustomer) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-2">Customer not found</p>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customer List
          </Button>
        </div>
      </div>
    )
  }

  const customer = selectedCustomer
  const customerAnalyticsData = customerAnalytics.top_customers.find((c: any) => c.customer_id === customerId)

  const getCustomerStatus = () => {
    if (customer.total_spent > 500) return { label: 'VIP Customer', color: 'bg-purple-100 text-purple-800' }
    if (customer.total_orders === 1) return { label: 'New Customer', color: 'bg-blue-100 text-blue-800' }
    if (customer.total_orders > 5) return { label: 'Loyal Customer', color: 'bg-green-100 text-green-800' }
    return { label: 'Regular Customer', color: 'bg-gray-100 text-gray-800' }
  }

  const status = getCustomerStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>
      </div>

      {/* Customer Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(customer.full_name || customer.email || 'U').charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{customer.full_name || 'Unknown Customer'}</h1>
                  <p className="text-gray-600 dark:text-gray-400">{customer.email}</p>
                </div>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{customer.total_orders}</p>
                  <p className="text-sm text-gray-500">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${customer.total_spent.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Total Spent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    ${customer.total_orders > 0 ? (customer.total_spent / customer.total_orders).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-gray-500">Avg Order</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {customer.last_order_date 
                      ? Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-gray-500">Days Since Last Order</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Purchase History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Customer Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Customer Since</span>
                  </div>
                  <span className="font-medium">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Order Frequency</span>
                  </div>
                  <span className="font-medium">
                    {customer.total_orders > 0 && customer.created_at
                      ? `${(customer.total_orders / Math.max(1, Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)))).toFixed(1)} orders/month`
                      : 'N/A'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Customer Value</span>
                  </div>
                  <span className="font-medium">
                    {customer.total_spent > 1000 ? 'High' : customer.total_spent > 300 ? 'Medium' : 'Low'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Loyalty Score</span>
                  </div>
                  <span className="font-medium">
                    {customer.total_orders > 5 ? 'High' : customer.total_orders > 2 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseHistory.slice(0, 5).map((order: any, index: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Package className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {purchaseHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No recent orders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Purchase History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="text-gray-500">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No purchase history</p>
                            <p className="text-sm">This customer hasn't made any orders yet</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseHistory.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="truncate">{order.product_name || 'Product details unavailable'}</p>
                              <p className="text-sm text-gray-500">Qty: {order.quantity || 1}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${order.total_amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lifetime Value</p>
                    <p className="text-2xl font-bold">${customer.total_spent.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold">{customer.total_orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
                    <p className="text-2xl font-bold">
                      ${customer.total_orders > 0 ? (customer.total_spent / customer.total_orders).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium">{customer.email || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                      <p className="font-medium">{customer.location || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                      <p className="font-medium">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}