"use client"

import { useState, useEffect, Suspense } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
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
import { Toaster } from "@/components/ui/sonner"
import { CategoryGrid } from "@/components/marketplace/CategoryGrid"
import { MobileFilters } from "@/components/marketplace/MobileFilters"
import { useCart } from "@/hooks/use-cart"

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
  available_quantity?: number
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
  const [searchResults, setSearchResults] = useState<{products: Product[], categories: Category[]}>({products: [], categories: []})
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>("grid")
  const [priceRange, setPriceRange] = useState("all")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items } = useCart()
  const supabase = createClientComponentClient()
  const isMobile = useMediaQuery('(max-width: 640px)')

  // Enhanced search function
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }
  useEffect(() => {
    const q = searchQuery.trim()
    const timer = setTimeout(() => {
      if (!q) {
        setSearchResults({products: [], categories: []})
        return
      }
      const lowerQuery = q.toLowerCase()
      const matchingProducts = products.filter(product => 
        product.title.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.seller.full_name.toLowerCase().includes(lowerQuery)
      )
      const matchingCategories = categories.filter(category => 
        category.name.toLowerCase().includes(lowerQuery) ||
        category.icon.toLowerCase().includes(lowerQuery)
      )
      setSearchResults({ products: matchingProducts, categories: matchingCategories })
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, products, categories])

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
          ),
          marketplace_inventory (
            available_quantity
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
        status: product.status,
        available_quantity: Array.isArray(product.marketplace_inventory) && product.marketplace_inventory[0]?.available_quantity != null
          ? product.marketplace_inventory[0].available_quantity
          : undefined
      })) || []

      setProducts(formattedProducts)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    const channel = supabase
      .channel('inventory-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_inventory' }, (payload) => {
        const productId = (payload.new as any)?.product_id
        const available = (payload.new as any)?.available_quantity
        if (!productId || available == null) return
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, available_quantity: available } : p))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

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

  const ProductCard = ({ product }: { product: Product }) => {
    const { addItem } = useCart()
    
    console.log('Rendering product card for:', product.title, 'in view mode:', viewMode)
    
    const handleAddToCart = async (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent card click navigation
      
      try {
        const { data: stockAvailable, error: stockError } = await supabase
          .rpc('check_stock_availability', {
            p_product_id: product.id,
            p_quantity: 1
          })

        if (stockError) {
          console.error('Stock check error:', stockError)
          toast.error('Failed to check stock')
          return
        }

        if (!stockAvailable) {
          toast.error('Insufficient stock available')
          return
        }

        const cartItem = {
          productId: product.id,
          title: product.title,
          price: product.price,
          currency: product.currency,
          image: product.images[0],
          sellerId: product.seller_id,
          quantity: 1
        }
        
        addItem(cartItem)
        toast.success(`Added ${product.title} to cart`)
      } catch (error) {
        console.error('Error adding item to cart:', error)
        toast.error('Failed to add item to cart')
      }
    }
    
    // Mobile List View - Compact horizontal layout
    if (viewMode === 'list') {
      return (
        <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push(`/marketplace/product/${product.id}`)}>
          <CardContent className="p-3">
            <div className="flex gap-3">
              {/* Product Image - Larger for mobile */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={product.images[0] || "/api/placeholder/400/300"}
                  alt={product.title}
                  fill
                  className="object-cover rounded-md"
                />
                {product.is_featured && (
                  <Badge className="absolute -top-1 -left-1 bg-yellow-500 text-yellow-900 text-xs px-1 py-0">
                    ★
                  </Badge>
                )}
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm line-clamp-2 flex-1 leading-tight">
                    {product.title}
                  </h3>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 flex-shrink-0">
                    <Heart className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-sm">
                      ${product.price}
                    </div>
                    {product.green_points_price && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        {product.green_points_price} GP
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={product.type === 'physical' ? 'default' : product.type === 'digital' ? 'secondary' : 'outline'} className="text-xs">
                      {product.type}
                    </Badge>
                    <Button 
                      onClick={handleAddToCart}
                      className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                      size="sm"
                    >
                      <ShoppingBag className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
    
    // Grid View - Optimized for mobile
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push(`/marketplace/product/${product.id}`)}>
        <div className="relative">
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            <Image
              src={product.images[0] || "/api/placeholder/400/300"}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {product.is_featured && (
              <Badge className="absolute top-1 left-1 bg-yellow-500 text-yellow-900 text-xs">
                ★
              </Badge>
            )}
            {product.sustainability_score && product.sustainability_score > 90 && (
              <Badge className="absolute top-1 right-1 bg-green-500 text-white text-xs">
                <Leaf className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-green-600 transition-colors flex-1 mr-1 leading-tight">
              {product.title}
            </h3>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 flex-shrink-0">
              <Heart className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-1 mb-2">
            <Avatar className="w-5 h-5">
              <AvatarImage src={product.seller.avatar_url} />
              <AvatarFallback className="text-xs">
                {product.seller.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {product.seller.full_name}
            </span>
            {product.seller.verified && (
              <Badge variant="secondary" className="text-xs px-1">
                ✓
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-sm">
                ${product.price}
              </div>
              {product.green_points_price && (
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {product.green_points_price} GP
                </div>
              )}
              {product.available_quantity != null && product.type === 'physical' && (
                <div className="text-xs text-gray-500">
                  In stock: {product.available_quantity}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              <Badge variant={product.type === 'physical' ? 'default' : product.type === 'digital' ? 'secondary' : 'outline'} className="text-xs px-1.5 py-0">
                {product.type}
              </Badge>
              {product.location && (
                <div className="flex items-center text-xs text-gray-500 max-w-20 truncate">
                  <MapPin className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                  <span className="truncate">{product.location}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleAddToCart}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-8"
            size="sm"
          >
            <ShoppingBag className="w-3 h-3 mr-1" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    )
  }

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Green Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
              Discover sustainable products and services from our community
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/marketplace/dashboard">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/marketplace/sell">
                <Plus className="w-4 h-4 mr-2" />
                Sell Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Filters */}
        <MobileFilters
          categories={categories}
          selectedCategory={selectedCategory}
          selectedType={selectedType}
          sortBy={sortBy}
          viewMode={viewMode}
          onCategoryChange={setSelectedCategory}
          onTypeChange={setSelectedType}
          onSortChange={setSortBy}
          onViewModeChange={setViewMode}
          onClearFilters={() => {
            setSelectedCategory("all")
            setSelectedType("all")
            setSortBy("newest")
          }}
          activeFilterCount={
            (selectedCategory !== "all" ? 1 : 0) +
            (selectedType !== "all" ? 1 : 0) +
            (sortBy !== "newest" ? 1 : 0)
          }
        />

        {/* Global Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Main Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search products, categories, services..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearch('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
                  >
                    ×
                  </Button>
                )}
              </div>
              
              {/* Desktop Filters */}
              <div className="hidden lg:flex flex-wrap gap-2 justify-center">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-40">
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
                  <SelectTrigger className="w-full sm:w-32">
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
                  <SelectTrigger className="w-full sm:w-40">
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
            layout={isMobile ? 'grid' : 'carousel'}
            maxItems={isMobile ? 6 : 8}
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Search Results for "{searchQuery}"
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch('')}
                  className="text-blue-600 dark:text-blue-400"
                >
                  Clear Search
                </Button>
              </div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                {searchResults.products.length} products • {searchResults.categories.length} categories found
              </div>
            </div>
          </div>
        )}

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
            <div className={`grid gap-3 sm:gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {sortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Floating Cart Button */}
        {items.length > 0 && (
          <Link href="/marketplace/cart">
            <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer z-50">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {items.length}
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
      <Toaster />
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
