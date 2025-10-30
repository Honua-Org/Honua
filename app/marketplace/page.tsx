"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Star,
  MapPin,
  Clock,
  Leaf,
  ShoppingBag,
  Heart,
  Share2,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { CategoryGrid } from "@/components/marketplace/CategoryGrid"

type Product = {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: string
  type: 'physical' | 'digital' | 'service'
  images: string[]
  seller_id: string
  seller: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    verified: boolean
  }
  location?: string
  green_points_price?: number
  sustainability_score?: number
  created_at: string
  updated_at: string
  is_featured: boolean
  status: 'active' | 'sold' | 'inactive'
}

type Category = {
  id: string
  name: string
  icon: string
  count: number
}

function MarketplaceContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState("all")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // Mock data for demonstration
  const mockProducts: Product[] = [
    {
      id: "1",
      title: "Eco-Friendly Solar Charger",
      description: "Portable solar charger made from recycled materials. Perfect for outdoor adventures while reducing carbon footprint.",
      price: 89.99,
      currency: "USD",
      category: "electronics",
      type: "physical",
      images: ["/api/placeholder/400/300"],
      seller_id: "user1",
      seller: {
        id: "user1",
        username: "ecotech_seller",
        full_name: "EcoTech Solutions",
        avatar_url: "/api/placeholder/40/40",
        verified: true
      },
      location: "San Francisco, CA",
      green_points_price: 450,
      sustainability_score: 95,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      is_featured: true,
      status: "active"
    },
    {
      id: "2",
      title: "Sustainable Living Consultation",
      description: "1-hour consultation on how to make your home more sustainable and reduce environmental impact.",
      price: 75.00,
      currency: "USD",
      category: "consulting",
      type: "service",
      images: ["/api/placeholder/400/300"],
      seller_id: "user2",
      seller: {
        id: "user2",
        username: "green_consultant",
        full_name: "Sarah Green",
        avatar_url: "/api/placeholder/40/40",
        verified: true
      },
      green_points_price: 375,
      sustainability_score: 100,
      created_at: "2024-01-14T15:30:00Z",
      updated_at: "2024-01-14T15:30:00Z",
      is_featured: false,
      status: "active"
    },
    {
      id: "3",
      title: "Carbon Footprint Tracker App",
      description: "Digital app to track and reduce your daily carbon footprint with personalized recommendations.",
      price: 29.99,
      currency: "USD",
      category: "software",
      type: "digital",
      images: ["/api/placeholder/400/300"],
      seller_id: "user3",
      seller: {
        id: "user3",
        username: "app_developer",
        full_name: "GreenCode Studios",
        avatar_url: "/api/placeholder/40/40",
        verified: false
      },
      green_points_price: 150,
      sustainability_score: 88,
      created_at: "2024-01-13T09:15:00Z",
      updated_at: "2024-01-13T09:15:00Z",
      is_featured: false,
      status: "active"
    }
  ]

  const mockCategories: Category[] = [
    { id: "electronics", name: "Electronics", icon: "📱", count: 45 },
    { id: "home", name: "Home & Garden", icon: "🏠", count: 32 },
    { id: "clothing", name: "Sustainable Fashion", icon: "👕", count: 28 },
    { id: "food", name: "Organic Food", icon: "🥬", count: 19 },
    { id: "consulting", name: "Consulting", icon: "💡", count: 15 },
    { id: "software", name: "Software", icon: "💻", count: 12 },
    { id: "education", name: "Education", icon: "📚", count: 8 }
  ]

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data: products, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          profiles:seller_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products')
        return
      }

      const formattedProducts: Product[] = products?.map(product => ({
        id: product.id,
        title: product.name || product.title,
        description: product.description,
        price: product.price,
        currency: product.currency || 'USD',
        category: product.category,
        type: product.type,
        images: product.images || ['/api/placeholder/400/300'],
        seller_id: product.seller_id,
        seller: {
          id: product.profiles?.id || product.seller_id,
          username: product.profiles?.username || 'Unknown',
          full_name: product.profiles?.full_name || 'Unknown Seller',
          avatar_url: product.profiles?.avatar_url || '/api/placeholder/40/40',
          verified: false
        },
        location: product.location,
        green_points_price: product.green_points_price,
        sustainability_score: product.sustainability_score,
        created_at: product.created_at,
        updated_at: product.updated_at,
        is_featured: product.is_featured || false,
        status: product.status
      })) || []

      setProducts(formattedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Get categories with product counts
      const { data: categoryData, error } = await supabase
        .from('marketplace_products')
        .select('category')
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      // Count products per category
      const categoryCounts: { [key: string]: number } = {}
      categoryData?.forEach(item => {
        if (item.category) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
        }
      })

      // Create categories array with counts
      const categories: Category[] = Object.entries(categoryCounts).map(([category, count]) => ({
        id: category,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        icon: getCategoryIcon(category),
        count
      }))

      setCategories(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      electronics: '📱',
      home: '🏠',
      clothing: '👕',
      food: '🥬',
      consulting: '💡',
      software: '💻',
      education: '📚',
      default: '📦'
    }
    return iconMap[category] || iconMap.default
  }

  // Handle URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams, selectedCategory])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesType = selectedType === "all" || product.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "sustainability":
        return (b.sustainability_score || 0) - (a.sustainability_score || 0)
      case "newest":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push(`/marketplace/product/${product.id}`)}>
      <div className="relative">
        <div className="aspect-video relative overflow-hidden rounded-t-lg">
          <Image
            src={product.images[0] || "/api/placeholder/400/300"}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {product.is_featured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
              Featured
            </Badge>
          )}
          {product.sustainability_score && product.sustainability_score > 90 && (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
              <Leaf className="w-3 h-3 mr-1" />
              Eco+
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-green-600 transition-colors">
            {product.title}
          </h3>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {product.description}
        </p>
        
        <div className="flex items-center space-x-2 mb-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src={product.seller.avatar_url} />
            <AvatarFallback className="text-xs">
              {product.seller.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {product.seller.full_name}
          </span>
          {product.seller.verified && (
            <Badge variant="secondary" className="text-xs">
              ✓
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-bold text-lg">
              ${product.price}
            </div>
            {product.green_points_price && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {product.green_points_price} GP
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <Badge variant={product.type === 'physical' ? 'default' : product.type === 'digital' ? 'secondary' : 'outline'}>
              {product.type}
            </Badge>
            {product.location && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="w-3 h-3 mr-1" />
                {product.location}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Green Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover sustainable products and services from our community
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline" asChild>
              <Link href="/marketplace/dashboard">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/marketplace/sell">
                <Plus className="w-4 h-4 mr-2" />
                Sell Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products and services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="sustainability">Most Sustainable</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Browse Categories</h2>
          <CategoryGrid 
            categories={categories.map(cat => ({
              id: cat.id,
              name: cat.name,
              slug: cat.id,
              product_count: cat.count,
              trending: cat.id === 'electronics' || cat.id === 'home',
              sustainability_focused: cat.id === 'food' || cat.id === 'consulting'
            }))}
          />
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
              <span className="text-gray-500 ml-2">({sortedProducts.length})</span>
            </h2>
          </div>
          
          {sortedProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search or filters
                </p>
                <Button onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedType('all')
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {sortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </MainLayout>
    }>
      <MarketplaceContent />
    </Suspense>
  )
}