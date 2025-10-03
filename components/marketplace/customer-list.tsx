'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Filter,
  Users,
  DollarSign,
  ShoppingCart,
  Calendar,
  Star,
  Eye,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { useCustomerData } from '@/hooks/use-customer-data'

interface CustomerListProps {
  sellerId: string
  onSelectCustomer: (customerId: string) => void
}

export function CustomerList({ sellerId, onSelectCustomer }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'revenue' | 'last_order'>('last_order')
  const [filterBy, setFilterBy] = useState<'all' | 'new' | 'returning' | 'vip'>('all')

  const { customers, customerAnalytics, loading, error } = useCustomerData(sellerId)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading customers...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading customers</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  // Filter and sort customers
  const filteredCustomers = customers
    .filter((customer: any) => {
      const matchesSearch = customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false

      switch (filterBy) {
        case 'new':
          return customer.total_orders === 1
        case 'returning':
          return customer.total_orders > 1
        case 'vip':
          return customer.total_spent > 500 // VIP threshold
        default:
          return true
      }
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '')
        case 'orders':
          return b.total_orders - a.total_orders
        case 'revenue':
          return b.total_spent - a.total_spent
        case 'last_order':
          return new Date(b.last_order_date || 0).getTime() - new Date(a.last_order_date || 0).getTime()
        default:
          return 0
      }
    })

  const getCustomerBadge = (customer: any) => {
    if (customer.total_spent > 500) return <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
    if (customer.total_orders === 1) return <Badge variant="outline">New</Badge>
    if (customer.total_orders > 5) return <Badge className="bg-green-100 text-green-800">Loyal</Badge>
    return <Badge variant="secondary">Regular</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Customer Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold">{customerAnalytics.total_customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">New Customers</p>
                <p className="text-2xl font-bold">{customerAnalytics.new_customers_this_month}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold">${customerAnalytics.average_order_value.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer LTV</p>
                <p className="text-2xl font-bold">${customerAnalytics.customer_lifetime_value.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Customer Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={(value: 'name' | 'orders' | 'revenue' | 'last_order') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_order">Last Order</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="orders">Total Orders</SelectItem>
                <SelectItem value="revenue">Total Spent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: 'all' | 'new' | 'returning' | 'vip') => setFilterBy(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="returning">Returning</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-center">Total Spent</TableHead>
                  <TableHead className="text-center">Last Order</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No customers found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer: any) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {(customer.full_name || customer.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{customer.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCustomerBadge(customer)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">{customer.total_orders}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">${customer.total_spent.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {customer.last_order_date 
                              ? new Date(customer.last_order_date).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectCustomer(customer.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement messaging functionality
                              console.log('Message customer:', customer.id)
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination could be added here if needed */}
          {filteredCustomers.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Top Customers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerAnalytics.top_customers.slice(0, 5).map((customer: any, index: any) => (
              <div key={customer.customer_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(customer.customer_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{customer.customer_name || 'Unknown Customer'}</p>
                    <p className="text-sm text-gray-500">{customer.total_orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${customer.total_spent.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Total spent</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}