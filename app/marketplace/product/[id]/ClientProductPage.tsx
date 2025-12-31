"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Heart, Star, ChevronLeft, ChevronRight, Leaf, CheckCircle, Loader2, Package, MapPin, MessageCircle, Store, Truck, Monitor, Clock, AlertCircle } from "lucide-react"
import { ProductActions } from "./ProductActions"

type Product = {
  id: string
  title: string
  description: string
  price: number
  currency: string
  green_points_price: number
  category: string
  type: 'physical' | 'digital' | 'service'
  images: string[]
  location?: string
  sustainability_features: string[]
  tags: string[]
  seller: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    verified: boolean
    rating: number
    total_sales: number
  }
  created_at: string
  shipping_info?: string
  digital_delivery_info?: string
  service_duration?: string
  service_location_type?: 'remote' | 'in-person' | 'both'
  stock_quantity?: number
  reviews_count: number
  average_rating: number
}

type Review = {
  id: string
  user: {
    username: string
    full_name: string
    avatar_url: string
  }
  rating: number
  comment: string
  created_at: string
  verified_purchase: boolean
}

export default function ClientProductPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [user, setUser] = useState<User | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true)
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const res = await fetch(`${origin}/api/marketplace/products/${params.id}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch product (${res.status})`)
        }
        const data = await res.json()
        const p: Product = {
          id: data.product.id,
          title: data.product.title,
          description: data.product.description,
          price: data.product.price,
          currency: data.product.currency,
          green_points_price: data.product.green_points_price,
          category: data.product.category,
          type: data.product.type,
          images: Array.isArray(data.product.images) && data.product.images.length > 0 ? data.product.images : ["https://placehold.co/600x400"],
          location: data.product.location,
          sustainability_features: data.product.sustainability_features || [],
          tags: data.product.tags || [],
          seller: {
            id: data.product.seller.id,
            username: data.product.seller.username,
            full_name: data.product.seller.full_name,
            avatar_url: data.product.seller.avatar_url,
            verified: !!data.product.seller.verified,
            rating: data.product.seller.rating ?? 0,
            total_sales: data.product.seller.total_sales ?? 0
          },
          created_at: data.product.created_at,
          shipping_info: data.product.shipping_info,
          digital_delivery_info: data.product.digital_delivery_info,
          service_duration: data.product.service_duration,
          service_location_type: data.product.service_location_type,
          stock_quantity: data.product.stock_quantity,
          reviews_count: data.product.reviews_count ?? 0,
          average_rating: data.product.average_rating ?? 0
        }
        setProduct(p)
        setIsLiked(!!data.product.liked_by_user)
        const transformedReviews: Review[] = (data.product.reviews || []).map((r: any) => ({
          id: r.id,
          user: {
            username: r.user?.username ?? "",
            full_name: r.user?.full_name ?? "",
            avatar_url: r.user?.avatar_url ?? "/api/placeholder/32/32"
          },
          rating: r.rating,
          comment: r.content,
          created_at: r.created_at,
          verified_purchase: !!r.verified_purchase
        }))
        setReviews(transformedReviews)
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error("Failed to load product details")
      } finally {
        setIsLoading(false)
      }
    }
    if (params.id) fetchProduct()
  }, [params.id, supabase])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
              <Image src={product.images[currentImageIndex]} alt={product.title} fill className="object-cover" />
              {product.images.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background" onClick={() => setCurrentImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background" onClick={() => setCurrentImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
            </div>

            <p className="text-3xl font-bold text-primary mb-4">${product.price}</p>

            <ProductActions
              product={product}
              quantity={quantity}
              isLiked={isLiked}
              onToggleWishlist={() => setIsLiked(prev => !prev)}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
