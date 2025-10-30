'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Package,
  DollarSign,
  Eye,
  Heart,
  ShoppingCart,
  Edit,
  Trash2,
  Plus,
  Minus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductAnalytics } from './product-analytics'
import { CustomerList } from './customer-list'
import { CustomerProfile } from './customer-profile'
import { PurchaseHistory } from './purchase-history'

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  type: 'physical' | 'digital' | 'service'
  images: string[]
  status: 'active' | 'inactive' | 'draft'
  views_count: number
  likes_count: number
  created_at: string
  updated_at: string
  quantity?: number
  low_stock_threshold?: number
}

interface SellerStats {
  total_products: number
  active_products: number
  total_views: number
  total_likes: number
  total_orders: number
  total_revenue: number
  low_stock_products: number
}

export function SellerDashboard() {
  const user = useUser()
  const supabase = createClientComponentClient()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchProducts()
      fetchStats()
    }
  }, [user?.id])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch basic product stats
      const { data: productStats, error: productError } = await supabase
        .from('marketplace_products')
        .select('status, views_count, favorites_count')
        .eq('seller_id', user?.id)

      if (productError) {
        console.error('Product stats error:', productError)
        throw productError
      }

      // Fetch order stats - using order_status instead of status
      const { data: orderStats, error: orderError } = await supabase
        .from('marketplace_orders')
        .select('total_price, order_status')
        .eq('seller_id', user?.id)

      if (orderError) {
        console.error('Order stats error:', orderError)
        throw orderError
      }

      // Fetch low stock products from marketplace_products table
      const { data: lowStockData, error: lowStockError } = await supabase
        .from('marketplace_products')
        .select('quantity, low_stock_threshold')
        .eq('seller_id', user?.id)
        .eq('type', 'physical') // Only physical products have inventory

      if (lowStockError) console.warn('Error fetching low stock data:', lowStockError)

      // Filter low stock products manually
      const lowStockProducts = lowStockData?.filter(product => {
        const quantity = product.quantity || 0
        const threshold = product.low_stock_threshold || 5
        return quantity <= threshold
      }) || []

      const stats: SellerStats = {
        total_products: productStats?.length || 0,
        active_products: productStats?.filter(p => p.status === 'active').length || 0,
        total_views: productStats?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0,
        total_likes: productStats?.reduce((sum, p) => sum + (p.favorites_count || 0), 0) || 0,
        total_orders: orderStats?.length || 0,
        total_revenue: orderStats?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0,
        low_stock_products: lowStockProducts.length
      }

      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const updateProductStatus = async (productId: string, status: 'active' | 'inactive' | 'draft') => {
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status })
        .eq('id', productId)

      if (error) throw error

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status } : p
      ))
      toast.success(`Product ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'saved as draft'}`)
    } catch (error) {
      console.error('Error updating product status:', error)
      toast.error('Failed to update product status')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateInventory = async (productId: string, quantity: number, lowStockThreshold: number) => {
    try {
      const inventoryResponse = await fetch('/api/marketplace/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          quantity: quantity,
          lowStockThreshold: lowStockThreshold
        })
      })

      if (!inventoryResponse.ok) {
        const errorData = await inventoryResponse.json()
        throw new Error(errorData.error || 'Failed to update inventory')
      }

      const { inventory } = await inventoryResponse.json()

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { 
              ...p, 
              quantity: inventory.quantity,
              low_stock_threshold: inventory.low_stock_threshold
            }
          : p
      ))
      toast.success('Inventory updated successfully')
      
      // Refresh products to get updated data
      await fetchProducts()
    } catch (error) {
      console.error('Error updating inventory:', error)
      toast.error('Failed to update inventory')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(prev => prev.filter(p => p.id !== productId))
      toast.success('Product deleted successfully')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesFilter = filter === 'all' || product.status === filter
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.type !== 'physical') return null
    
    const quantity = product.quantity || 0
    const low_stock_threshold = product.low_stock_threshold || 5
    
    if (quantity <= 0) {
      return { status: 'out-of-stock', color: 'text-red-600', text: 'Out of Stock' }
    } else if (quantity <= low_stock_threshold) {
      return { status: 'low-stock', color: 'text-yellow-600', text: 'Low Stock' }
    } else {
      return { status: 'in-stock', color: 'text-green-600', text: 'In Stock' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Low Stock Alert */}
      {stats && stats.low_stock_products > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Low Stock Alert
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {stats.low_stock_products} product(s) are running low on stock
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">My Products</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Products</CardTitle>
                <Button asChild>
                  <Link href="/marketplace/sell">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products List */}
              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'No products match your search' : 'No products found'}
                    </p>
                    {!searchTerm && (
                      <Button asChild className="mt-4">
                        <Link href="/marketplace/sell">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Product
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    
                    return (
                      <Card key={product.id} className="p-4">
                        <div className="flex items-start space-x-4">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {product.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {product.description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    ${product.price}
                                  </span>
                                  <Badge className={getStatusColor(product.status)}>
                                    {product.status}
                                  </Badge>
                                  {stockStatus && (
                                    <span className={`text-sm font-medium ${stockStatus.color}`}>
                                      {stockStatus.text}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteProduct(product.id)}
                                  disabled={isUpdating}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>{product.views_count || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4" />
                                <span>{product.likes_count || 0}</span>
                              </div>
                              {product.type === 'physical' && (
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>{product.quantity || 0} available</span>
                </div>
              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center space-x-2 mt-3">
                              {product.status === 'active' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateProductStatus(product.id, 'inactive')}
                                  disabled={isUpdating}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateProductStatus(product.id, 'active')}
                                  disabled={isUpdating}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Activate
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/marketplace/product/${product.id}`}>
                                  View Product
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <ProductAnalytics sellerId={user?.id || ''} />
        </TabsContent>

        <TabsContent value="customers">
          <div className="space-y-6">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">Customer List</TabsTrigger>
                <TabsTrigger value="profile">Customer Profile</TabsTrigger>
                <TabsTrigger value="history">Purchase History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                <CustomerList 
                  sellerId={user?.id || ''} 
                  onSelectCustomer={(customerId: string) => setSelectedCustomerId(customerId)}
                />
              </TabsContent>
              
              <TabsContent value="profile">
                <CustomerProfile 
                  sellerId={user?.id || ''} 
                  customerId={selectedCustomerId || ''}
                  onBack={() => setSelectedCustomerId(null)}
                />
              </TabsContent>
              
              <TabsContent value="history">
                <PurchaseHistory sellerId={user?.id || ''} />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <QuickEditForm
              product={selectedProduct}
              onSave={(updatedProduct: Product) => {
                setProducts(prev => prev.map(p => 
                  p.id === updatedProduct.id ? updatedProduct : p
                ))
                setIsEditDialogOpen(false)
                toast.success('Product updated successfully')
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Quick Edit Form Component
interface QuickEditFormProps {
  product: Product
  onSave: (product: Product) => void
  onCancel: () => void
}

function QuickEditForm({ product, onSave, onCancel }: QuickEditFormProps) {
  const supabase = createClientComponentClient()
  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description,
    price: product.price,
    status: product.status,
    quantity: product.quantity || 0,
    lowStockThreshold: product.low_stock_threshold || 5
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update product
      const { data: updatedProduct, error: productError } = await supabase
        .from('marketplace_products')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          status: formData.status
        })
        .eq('id', product.id)
        .select('*')
        .single()

      if (productError) throw productError

      // Handle inventory for physical products
      if (product.type === 'physical') {
        const inventoryResponse = await fetch('/api/marketplace/inventory', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: formData.quantity,
            lowStockThreshold: formData.lowStockThreshold
          })
        })

        if (!inventoryResponse.ok) {
          const errorData = await inventoryResponse.json()
          
          // Handle migration requirement specifically
          if (errorData.requiresMigration) {
            throw new Error(`Database Update Required: ${errorData.message || 'Please run the database migration to add inventory columns.'}`)
          }
          
          throw new Error(errorData.error || 'Failed to update inventory')
        }

        const inventoryData = await inventoryResponse.json()
        const updatedInventory = inventoryData.product || inventoryData.inventory

        // Update the product object with new inventory data
        if (updatedInventory) {
          updatedProduct.quantity = updatedInventory.quantity
          updatedProduct.low_stock_threshold = updatedInventory.low_stock_threshold || formData.lowStockThreshold || 5
        }
      }

      onSave(updatedProduct)
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {product.type === 'physical' && (
          <>
            <div>
              <Label htmlFor="quantity">Stock Quantity</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    quantity: Math.max(0, prev.quantity - 1) 
                  }))}
                  disabled={formData.quantity <= 0}
                  className="h-10 w-10 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    if (value >= 0) {
                      setFormData(prev => ({ ...prev, quantity: value }))
                    }
                  }}
                  className="text-center font-medium"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    quantity: prev.quantity + 1 
                  }))}
                  className="h-10 w-10 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  if (value >= 0) {
                    setFormData(prev => ({ ...prev, lowStockThreshold: value }))
                  }
                }}
                placeholder="Alert threshold"
              />
            </div>
          </>
        )}
      </div>

      {product.type === 'physical' && (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <span className="text-sm font-medium text-green-700 dark:text-green-300">Available Stock:</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formData.quantity}
          </span>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}