'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Eye,
  Heart,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  Star,
  Loader2,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { useRealTimeAnalytics } from '@/hooks/use-real-time-analytics'
import { useProductMetrics } from '@/hooks/use-product-metrics'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

interface ProductAnalyticsProps {
  sellerId: string
  productId?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ProductAnalytics({ sellerId, productId }: ProductAnalyticsProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>(productId || 'all')
  const [timeRange, setTimeRange] = useState<string>('30')
  
  // Use real-time analytics hooks
  const analyticsData = useRealTimeAnalytics(sellerId, timeRange)
  
  const productData = useProductMetrics(sellerId, timeRange)

  useEffect(() => {
    if (selectedProduct !== 'all') {
      const product = productData.products.find(p => p.product_id === selectedProduct)
      if (product) {
        productData.selectProduct(product)
      }
    }
  }, [selectedProduct, productData])

  const loading = analyticsData.loading || productData.loading
  const error = analyticsData.error || productData.error

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading analytics</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  // Check if we have any analytics data
  const hasAnalyticsData = analyticsData.dailyAnalytics && analyticsData.dailyAnalytics.length > 0
  const hasProductData = productData.products && productData.products.length > 0

  // Show empty state if no data is available
  if (!hasAnalyticsData && !hasProductData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Analytics Data Available</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Analytics data will appear here once you have products and customer interactions.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Data is fetched in real-time from your database.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate aggregated metrics
  const aggregatedData = {
    total_views: analyticsData.dailyAnalytics.reduce((sum: number, day: any) => sum + day.total_views, 0),
    total_orders: analyticsData.dailyAnalytics.reduce((sum: number, day: any) => sum + day.total_orders, 0),
    total_revenue: analyticsData.dailyAnalytics.reduce((sum: number, day: any) => sum + day.total_revenue, 0),
    total_messages: analyticsData.dailyAnalytics.reduce((sum: number, day: any) => sum + day.total_messages, 0),
    avg_conversion_rate: analyticsData.dailyAnalytics.length > 0 
      ? analyticsData.dailyAnalytics.reduce((sum: number, day: any) => {
          const rate = day.total_views > 0 ? (day.total_orders / day.total_views) * 100 : 0
          return sum + rate
        }, 0) / analyticsData.dailyAnalytics.length 
      : 0
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {productData.products.map((product: any) => (
              <SelectItem key={product.product_id} value={product.product_id}>
                {product.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold">{aggregatedData.total_views.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold">{aggregatedData.total_orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-bold">${aggregatedData.total_revenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold">{aggregatedData.avg_conversion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Views Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Daily Views Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.dailyAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total_views" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Views"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="unique_views" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Unique Views"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Top Performing Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topProducts.slice(0, 5).map((product: any, index: any) => (
                    <div key={product.product_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium text-sm">{product.product_title}</p>
                          <p className="text-xs text-gray-500">
                            {product.total_orders} orders • {product.total_views} views
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${product.total_revenue.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {product.conversion_rate.toFixed(1)}% conversion
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue and Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Revenue &amp; Orders Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.dailyAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Revenue ($)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="total_orders"
                    fill="#82ca9d"
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {selectedProduct !== 'all' && productData.selectedProduct && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Weekly Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productData.performance.weekly_performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#8884d8" name="Views" />
                      <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Product Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span>Total Views</span>
                      </div>
                      <span className="font-semibold">{productData.selectedProduct.views}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>Total Likes</span>
                      </div>
                      <span className="font-semibold">{productData.selectedProduct.likes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        <span>Messages</span>
                      </div>
                      <span className="font-semibold">{productData.selectedProduct.messages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="w-4 h-4 text-purple-500" />
                        <span>Orders</span>
                      </div>
                      <span className="font-semibold">{productData.selectedProduct.orders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-yellow-500" />
                        <span>Revenue</span>
                      </div>
                      <span className="font-semibold">${productData.selectedProduct.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span>Conversion Rate</span>
                      </div>
                      <span className="font-semibold">{productData.selectedProduct.conversion_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedProduct === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Product</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Please select a specific product to view detailed performance metrics.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Engagement Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Likes</span>
                    <span className="font-semibold">{analyticsData.engagementMetrics?.total_likes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Messages</span>
                    <span className="font-semibold">{analyticsData.engagementMetrics?.total_messages || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg. Response Time</span>
                    <span className="font-semibold">{analyticsData.engagementMetrics?.avg_response_time || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engagement Rate</span>
                    <span className="font-semibold">{analyticsData.engagementMetrics?.engagement_rate?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Traffic Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.trafficSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.trafficSources.map((entry: any, index: any) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Groups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Age Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[analyticsData.demographics]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age_group" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Geographic Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.demographics.locations?.map((location: any, index: any) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{location.city}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((location.count / Math.max(...(analyticsData.demographics.locations?.map((l: any) => l.count) || [1]))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{location.count}</span>
                      </div>
                    </div>
                  )) || <div className="text-sm text-gray-500">No location data available</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}