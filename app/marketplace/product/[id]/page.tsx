"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Heart,
  Share2,
  ShoppingCart,
  Leaf,
  Star,
  MapPin,
  Clock,
  Shield,
  Truck,
  MessageCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  Monitor,
  CreditCard,
  Coins,
  Store,
  Settings
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import ShippingForm, { ShippingInfo } from "@/components/ShippingForm"
import StripePaymentForm from "@/components/StripePaymentForm"

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

// Mock data - in real implementation, this would come from API
const mockProduct: Product = {
  id: "1",
  title: "Eco-Friendly Bamboo Phone Case",
  description: "Protect your phone while protecting the planet! This beautiful bamboo phone case is crafted from sustainably sourced bamboo and features a sleek, minimalist design. The case provides excellent protection against drops and scratches while being completely biodegradable.\n\nFeatures:\n• Made from 100% sustainable bamboo\n• Precise cutouts for all ports and buttons\n• Raised edges protect camera and screen\n• Lightweight and durable\n• Naturally antimicrobial\n• Biodegradable packaging",
  price: 29.99,
  currency: "USD",
  green_points_price: 180,
  category: "electronics",
  type: "physical",
  images: [
    "/api/placeholder/600/600",
    "/api/placeholder/600/600",
    "/api/placeholder/600/600",
    "/api/placeholder/600/600"
  ],
  location: "Portland, Oregon",
  sustainability_features: [
    "Made from recycled materials",
    "Biodegradable packaging",
    "Carbon neutral shipping",
    "Locally sourced"
  ],
  tags: ["bamboo", "phone case", "eco-friendly", "sustainable", "biodegradable"],
  seller: {
    id: "seller1",
    username: "ecocrafter",
    full_name: "Sarah Green",
    avatar_url: "/api/placeholder/40/40",
    verified: true,
    rating: 4.8,
    total_sales: 247
  },
  created_at: "2024-01-15T10:00:00Z",
  shipping_info: "Free shipping on orders over $25. Ships within 2-3 business days.",
  stock_quantity: 15,
  reviews_count: 42,
  average_rating: 4.7
}

const mockReviews: Review[] = [
  {
    id: "1",
    user: {
      username: "naturelover",
      full_name: "Mike Johnson",
      avatar_url: "/api/placeholder/32/32"
    },
    rating: 5,
    comment: "Amazing quality! The bamboo feels premium and the fit is perfect. Love supporting sustainable products.",
    created_at: "2024-01-10T14:30:00Z",
    verified_purchase: true
  },
  {
    id: "2",
    user: {
      username: "techie_green",
      full_name: "Emma Davis",
      avatar_url: "/api/placeholder/32/32"
    },
    rating: 4,
    comment: "Great case, good protection. Only wish it came in more colors.",
    created_at: "2024-01-08T09:15:00Z",
    verified_purchase: true
  }
]

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'currency' | 'green_points'>('currency')
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [contactMessage, setContactMessage] = useState("")
  const [showShippingForm, setShowShippingForm] = useState(false)
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null)
  const [purchaseStep, setPurchaseStep] = useState<'product' | 'shipping' | 'payment'>('product')
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [showStripePayment, setShowStripePayment] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  
  useEffect(() => {
    // Check authentication status
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
      fetchReviews(params.id as string)
      trackProductView(params.id as string)
    }
  }, [params.id, user])

  const fetchProduct = async (productId: string) => {
    try {
      setIsLoading(true)
      console.log('=== FETCHING PRODUCT ===', {
        productId,
        productIdType: typeof productId,
        timestamp: new Date().toISOString()
      })

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(productId)) {
        console.error('Invalid product ID format:', productId)
        toast.error('Invalid product ID format')
        setProduct(null)
        setIsLoading(false)
        return
      }
      
      const { data: product, error } = await supabase
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
            quantity,
            reserved_quantity,
            available_quantity
          )
        `)
        .eq('id', productId)
        .single()

      console.log('=== PRODUCT FETCH RESULT ===', {
        hasError: !!error,
        error: error,
        hasProduct: !!product,
        productId: product?.id,
        productName: product?.name || product?.title
      })

      if (error) {
        console.error('Error fetching product:', error)
        console.log('=== SETTING PRODUCT TO NULL DUE TO ERROR ===', {
          errorCode: error.code,
          errorMessage: error.message
        })
        toast.error('Product not found')
        setProduct(null)
        return
      }

      if (!product) {
        console.log('=== SETTING PRODUCT TO NULL DUE TO NO PRODUCT ===')
        toast.error('Product not found')
        setProduct(null)
        return
      }

      // Determine stock quantity based on product type and available data
      let stockQuantity = 0
      
      if (product.type === 'digital') {
        // Digital products are always available (infinite stock)
        stockQuantity = 999999
      } else {
        // For physical products, use inventory data if available, otherwise use product quantity
        if (product.marketplace_inventory?.[0]) {
          stockQuantity = product.marketplace_inventory[0].available_quantity || product.marketplace_inventory[0].quantity || 0
        } else {
          // Fallback to product quantity if no inventory record exists
          stockQuantity = product.quantity || 0
        }
      }

      // Format product data
      const formattedProduct: Product = {
        id: product.id,
        title: product.name || product.title,
        description: product.description,
        price: product.price,
        currency: product.currency || 'USD',
        green_points_price: product.green_points_price || 0,
        category: product.category,
        type: product.type,
        images: product.images || ['/api/placeholder/600/600'],
        location: product.location,
        sustainability_features: product.sustainability_features || [],
        tags: product.tags || [],
        seller: {
          id: product.profiles?.id || product.seller_id,
          username: product.profiles?.username || 'Unknown',
          full_name: product.profiles?.full_name || 'Unknown Seller',
          avatar_url: product.profiles?.avatar_url || '/api/placeholder/40/40',
          verified: false,
          rating: 4.5, // TODO: Calculate from reviews
          total_sales: 0 // TODO: Calculate from orders
        },
        created_at: product.created_at,
        shipping_info: product.shipping_info,
        digital_delivery_info: product.digital_delivery_info,
        service_duration: product.service_duration,
        service_location_type: product.service_location_type,
        stock_quantity: stockQuantity,
        reviews_count: 0, // Will be updated when reviews are fetched
        average_rating: 0 // Will be updated when reviews are fetched
      }

      console.log('=== SETTING PRODUCT STATE ===', {
        formattedProductId: formattedProduct.id,
        formattedProductTitle: formattedProduct.title,
        originalProductId: product.id,
        timestamp: new Date().toISOString()
      })
      
      setProduct(formattedProduct)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async (productId: string) => {
    try {
      if (!productId) {
        console.warn('No product ID provided for fetching reviews')
        return
      }

      const { data: reviews, error } = await supabase
        .from('marketplace_reviews')
        .select(`
          id,
          rating,
          content,
          created_at,
          verified_purchase,
          reviewer_id
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching reviews:', {
          message: error.message || 'Unknown error',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          productId
        })
        // Set empty reviews instead of returning early
        setReviews([])
        return
      }

      if (!reviews) {
        console.warn('No reviews data returned from Supabase')
        setReviews([])
        return
      }

      const formattedReviews: Review[] = reviews.map(review => ({
        id: review.id,
        user: {
          username: 'Anonymous',
          full_name: 'Anonymous User',
          avatar_url: '/api/placeholder/32/32'
        },
        rating: review.rating || 0,
        comment: review.content || '',
        created_at: review.created_at,
        verified_purchase: review.verified_purchase || false
      }))

      setReviews(formattedReviews)

      // Update product with review stats
      if (formattedReviews.length > 0) {
        const averageRating = formattedReviews.reduce((sum, review) => sum + review.rating, 0) / formattedReviews.length
        setProduct(prev => prev ? {
          ...prev,
          reviews_count: formattedReviews.length,
          average_rating: averageRating
        } : null)
      } else {
        // Set zero stats when no reviews
        setProduct(prev => prev ? {
          ...prev,
          reviews_count: 0,
          average_rating: 0
        } : null)
      }
    } catch (error) {
      console.error('Unexpected error fetching reviews:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        productId
      })
      // Ensure reviews are set to empty array on error
      setReviews([])
    }
  }

  const trackProductView = async (productId: string) => {
    try {
      // Only track views for authenticated users to avoid spam
      if (!user?.id) return

      // Don't track views for the product owner
      if (product?.seller?.id === user.id) return

      const response = await fetch('/api/marketplace/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          userId: user.id,
          action: 'view',
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            url: window.location.href
          }
        })
      })

      if (!response.ok) {
        console.warn('Failed to track product view:', response.statusText)
      }
    } catch (error) {
      console.warn('Error tracking product view:', error)
    }
  }

  const handleInitiatePurchase = () => {
    if (!user?.id) {
      toast.error("Please log in to make a purchase")
      router.push('/auth/login')
      return
    }

    if (!product) {
      toast.error("Product not found")
      return
    }

    // For physical products, show shipping form first
    if (product.type === 'physical') {
      setPurchaseStep('shipping')
      setShowShippingForm(true)
    } else {
      // For digital/service products, proceed directly to payment
      handlePurchase()
    }
  }

  const handleShippingSubmit = (shipping: ShippingInfo) => {
    setShippingInfo(shipping)
    setShowShippingForm(false)
    setPurchaseStep('payment')
    // Proceed with purchase after collecting shipping info, passing shipping data directly
    handlePurchase(undefined, shipping)
  }

  const handlePurchase = async (paymentMethod?: string, providedShippingInfo?: ShippingInfo) => {
    console.log('=== HANDLE PURCHASE START ===', {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      productId: product?.id,
      paymentMethod: paymentMethod || selectedPaymentMethod,
      quantity,
      hasShippingInfo: !!shippingInfo,
      productType: product?.type,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href
    })
    
    if (!user?.id) {
      console.error('Purchase failed: User not authenticated')
      toast.error("Please log in to make a purchase")
      router.push('/auth/login')
      return
    }

    if (!product) {
      console.error('Purchase failed: Product not found')
      toast.error("Product not found")
      return
    }

    // For physical products, ensure shipping info is collected
    if (product.type === 'physical' && !(providedShippingInfo || shippingInfo)) {
      console.error('Purchase failed: Missing shipping info for physical product')
      toast.error("Please provide shipping information")
      setPurchaseStep('shipping')
      setShowShippingForm(true)
      return
    }

    setIsPurchasing(true)
    
    // Validate required fields before proceeding
    const validationErrors: string[] = []
    
    if (!product?.id) {
      validationErrors.push('Product information is missing')
    }
    
    if (!quantity || quantity < 1) {
      validationErrors.push('Invalid quantity selected')
    }
    
    if (!selectedPaymentMethod && !paymentMethod) {
      validationErrors.push('Payment method must be selected')
    }
    
    const finalPaymentMethod = paymentMethod || selectedPaymentMethod
    
    // Define shipping info for validation and order data
    const currentShippingInfo = providedShippingInfo || shippingInfo
    
    // Validate payment method specific requirements
    if (finalPaymentMethod === 'green_points') {
      if (!product.green_points_price || product.green_points_price <= 0) {
        validationErrors.push('This product is not available for Green Points purchase')
      }
    } else {
      if (!product.price || product.price <= 0) {
        validationErrors.push('Product price is not available')
      }
    }
    
    // Validate shipping information for physical products
    if (product.type === 'physical') {
      if (!currentShippingInfo) {
        validationErrors.push('Shipping information is required for physical products')
      } else {
        const requiredShippingFields = [
          { field: 'fullName', label: 'Full name' },
          { field: 'address', label: 'Address' },
          { field: 'city', label: 'City' },
          { field: 'state', label: 'State' },
          { field: 'postalCode', label: 'Postal code' },
          { field: 'country', label: 'Country' },
          { field: 'phone', label: 'Phone number' },
          { field: 'email', label: 'Email address' }
        ]
        
        for (const { field, label } of requiredShippingFields) {
          if (!currentShippingInfo[field as keyof typeof currentShippingInfo] || 
              String(currentShippingInfo[field as keyof typeof currentShippingInfo]).trim() === '') {
            validationErrors.push(`${label} is required for shipping`)
          }
        }
      }
    }
    
    // If there are validation errors, show them and return
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors)
      toast.error(`Please fix the following issues:\n${validationErrors.join('\n')}`)
      setIsPurchasing(false)
      return
    }
    
    // Map frontend payment method to backend expected values
    let backendPaymentMethod: string
    if (finalPaymentMethod === 'green_points') {
      backendPaymentMethod = 'green_points'
    } else if (finalPaymentMethod === 'currency') {
      // For Stripe payments, we'll handle payment method creation in the frontend
      backendPaymentMethod = 'stripe'
    } else {
      backendPaymentMethod = 'stripe' // Default to stripe for any other value
    }
    
    console.log('=== PAYMENT METHOD MAPPING ===', {
      frontendPaymentMethod: finalPaymentMethod,
      backendPaymentMethod: backendPaymentMethod,
      timestamp: new Date().toISOString()
    })
    
    // Prepare order data outside try block for error logging
    const orderData = {
      product_id: product.id,
      quantity: quantity,
      payment_method: backendPaymentMethod,
      unit_price: finalPaymentMethod === 'green_points' ? 0 : product.price,
      total_price: finalPaymentMethod === 'green_points' ? 0 : product.price * quantity,
      green_points_used: finalPaymentMethod === 'green_points' ? product.green_points_price * quantity : 0,
      shipping_address: product.type === 'physical' && currentShippingInfo ? {
        street: currentShippingInfo.address,
        city: currentShippingInfo.city,
        state: currentShippingInfo.state,
        zip: currentShippingInfo.postalCode,
        country: currentShippingInfo.country,
        full_name: currentShippingInfo.fullName,
        phone: currentShippingInfo.phone,
        email: currentShippingInfo.email,
        additional_notes: currentShippingInfo.additionalNotes
      } : null
    }
    
    console.log('=== ORDER DATA PREPARED ===', {
      productId: product.id,
      productIdType: typeof product.id,
      productTitle: product.title,
      urlParamId: params.id,
      urlParamIdType: typeof params.id,
      orderDataProductId: orderData.product_id,
      timestamp: new Date().toISOString()
    })
    
    try {
      // Get current session for authentication with retry mechanism
      let session = null
      let sessionError = null
      
      // First attempt to get session
      const sessionResult = await supabase.auth.getSession()
      session = sessionResult.data.session
      sessionError = sessionResult.error
      
      // If session is null, try to refresh it
      if (!session && !sessionError) {
        console.log('Session not found, attempting to refresh...')
        const refreshResult = await supabase.auth.refreshSession()
        session = refreshResult.data.session
        sessionError = refreshResult.error
      }
      
      // Final validation
      if (sessionError || !session || !session.user) {
        console.error('Authentication failed:', {
          sessionError: sessionError,
          hasSession: !!session,
          hasUser: !!session?.user
        })
        toast.error("Authentication required. Please log in again.")
        router.push('/auth/login')
        return
      }
      
      // Update user state to ensure consistency
      if (session.user && (!user || user.id !== session.user.id)) {
        setUser(session.user)
      }

      console.log('=== PREPARING API REQUEST ===', {
        timestamp: new Date().toISOString(),
        orderData: orderData,
        orderDataStringified: JSON.stringify(orderData, null, 2),
        sessionInfo: {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          accessTokenLength: session?.access_token?.length || 0,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        },
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token.substring(0, 20)}...` : 'NO_TOKEN'
        },
        requestUrl: '/api/marketplace/orders',
        requestMethod: 'POST'
      })
      
      console.log('=== SENDING API REQUEST ===', {
        timestamp: new Date().toISOString(),
        url: '/api/marketplace/orders'
      })
      
      const response = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      })
      
      console.log('=== API REQUEST COMPLETED ===', {
        timestamp: new Date().toISOString(),
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseOk: response.ok,
        responseType: response.type,
        responseUrl: response.url
      })

      console.log('Order API response status:', response.status, response.statusText)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      let result
      try {
        console.log('=== PROCESSING API RESPONSE ===')
        const responseText = await response.text()
        console.log('Raw API response length:', responseText.length)
        console.log('Raw API response (first 500 chars):', responseText.substring(0, 500))
        console.log('Raw API response (full):', responseText)
        
        if (responseText.trim()) {
          try {
            console.log('Attempting to parse JSON...')
            result = JSON.parse(responseText)
            console.log('Successfully parsed JSON response:', result)
            console.log('Result type:', typeof result)
            console.log('Result keys:', Object.keys(result || {}))
          } catch (jsonError) {
            console.error('=== JSON PARSE ERROR ===')
            console.error('JSON parse error details:', {
              error: jsonError,
              message: jsonError instanceof Error ? jsonError.message : String(jsonError),
              responseText: responseText,
              responseLength: responseText.length
            })
            result = { 
              error: 'Invalid response format from server',
              details: responseText.substring(0, 200), // First 200 chars for debugging
              parseError: jsonError instanceof Error ? jsonError.message : String(jsonError)
            }
          }
        } else {
          console.error('=== EMPTY RESPONSE FROM SERVER ===')
          console.error('Response status:', response.status)
          console.error('Response status text:', response.statusText)
          result = { 
            error: 'Empty response from server',
            status: response.status,
            statusText: response.statusText
          }
        }
        console.log('=== END PROCESSING API RESPONSE ===')
      } catch (parseError) {
        console.error('=== RESPONSE PROCESSING ERROR ===')
        console.error('Failed to read response:', {
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          parseErrorStack: parseError instanceof Error ? parseError.stack : undefined,
          responseStatus: response.status,
          responseStatusText: response.statusText,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseType: typeof response,
          responseOk: response.ok
        })
        console.error('=== END RESPONSE PROCESSING ERROR ===')
        throw new Error(`Server communication error (${response.status}: ${response.statusText}). Please check your connection and try again.`)
      }

      if (!response.ok) {
        // Use the already parsed result instead of calling response.json() again
        let errorMessage = result?.error || result?.details || result?.message || `HTTP ${response.status}: ${response.statusText}`
        
        // Handle specific error cases with user-friendly messages
        if (response.status === 401) {
          if (errorMessage.includes('Stripe') || errorMessage.includes('authentication')) {
            errorMessage = 'Payment service is currently unavailable due to configuration issues. Please contact support or try again later.'
          } else {
            errorMessage = 'Authentication failed. Please log in again and try your purchase.'
          }
        } else if (response.status === 400) {
          errorMessage = 'Invalid order details. Please check your information and try again.'
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again in a few moments.'
        } else if (response.status >= 500) {
          errorMessage = 'Service temporarily unavailable. Please try again later.'
        }
        
        // Log detailed error information for debugging
        console.error('=== ORDER CREATION FAILED ===')
        console.error('Status:', response.status)
        console.error('Status Text:', response.statusText)
        console.error('Error Message:', errorMessage)
        console.error('Server Response:', JSON.stringify(result, null, 2))
        console.error('Original Error:', result?.error || result?.message)
        console.error('Error Details:', result?.details)
        
        // Throw a proper Error object instead of logging an object that becomes '{}'
        const errorToThrow = new Error(`Order creation failed: ${errorMessage}`)
        errorToThrow.name = 'OrderCreationError'
        throw errorToThrow
      }
      
      // Handle different payment methods
      const finalPaymentMethod = paymentMethod || selectedPaymentMethod
      
      console.log('=== HANDLING SUCCESSFUL RESPONSE ===', {
        finalPaymentMethod: finalPaymentMethod,
        hasStripeClientSecret: !!result.stripe_client_secret,
        hasClientSecret: !!result.client_secret,
        hasPaymentIntentId: !!result.payment_intent_id,
        resultKeys: Object.keys(result || {}),
        timestamp: new Date().toISOString()
      })
      
      if (finalPaymentMethod === 'green_points') {
        // Green points payment completed immediately
        const amount = `${product?.green_points_price * quantity} GP`
        toast.success(`Purchase successful! Paid ${amount} for ${quantity} item(s). Order ID: ${result.order.id}`)
        router.push(`/marketplace/orders/${result.order.id}`)
      } else if ((finalPaymentMethod === 'currency' || finalPaymentMethod === 'stripe') && (result.stripe_client_secret || result.client_secret)) {
        // Stripe payment - show payment form
        const clientSecret = result.stripe_client_secret || result.client_secret
        setStripeClientSecret(clientSecret)
        setCurrentOrderId(result.order?.id || result.id)
        setShowStripePayment(true)
        setPurchaseStep('payment')
        console.log('=== STRIPE PAYMENT SETUP ===', {
          clientSecret: clientSecret ? clientSecret.substring(0, 20) + '...' : 'NONE',
          orderId: result.order?.id || result.id,
          timestamp: new Date().toISOString()
        })
      } else {
        // Fallback for other payment methods or completed orders
        const amount = `$${(product?.price || 0) * quantity}`
        toast.success(`Purchase successful! Paid ${amount} for ${quantity} item(s). Order ID: ${result.order?.id || result.id}`)
        router.push(`/marketplace/orders/${result.order?.id || result.id}`)
      }
    } catch (error) {
      // Enhanced error logging with more details
      console.error('=== PURCHASE ERROR CAUGHT ===');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error prototype:', Object.getPrototypeOf(error));
      console.error('Error is instance of Error:', error instanceof Error);
      console.error('Error object:', error);
      console.error('Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('Error keys:', Object.keys(error || {}));
      console.error('Error own property names:', Object.getOwnPropertyNames(error || {}));
      
      // Log the order data that was being processed
      console.error('Order data being processed:', {
        orderData: orderData,
        productId: product?.id,
        userId: user?.id,
        paymentMethod: paymentMethod || selectedPaymentMethod,
        quantity: quantity
      });
      
      // Extract meaningful error message with enhanced handling
      let errorMessage = 'An unexpected error occurred during purchase';
      
      try {
        if (error instanceof Error) {
          errorMessage = error.message || 'Error object has no message';
          console.error('Error message from Error instance:', errorMessage);
          
          // Check for specific error types
          if (error.name === 'TypeError') {
            errorMessage = `Type Error: ${error.message}. This might be due to missing data or incorrect API response.`;
          } else if (error.name === 'SyntaxError') {
            errorMessage = `Syntax Error: ${error.message}. This might be due to invalid JSON response.`;
          } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else if (error.message.includes('JSON')) {
            errorMessage = 'Invalid server response format. Please try again.';
          }
        } else if (typeof error === 'string') {
          errorMessage = error || 'Empty string error';
          console.error('String error:', errorMessage);
        } else if (error && typeof error === 'object') {
          console.error('Processing object error...');
          const errorObj = error as any;
          
          // Try multiple ways to extract error information
          const possibleMessages = [
            errorObj.message,
            errorObj.error,
            errorObj.details,
            errorObj.statusText,
            errorObj.data?.error,
            errorObj.data?.message,
            errorObj.response?.data?.error,
            errorObj.response?.data?.message
          ];
          
          console.error('Possible error messages found:', possibleMessages);
          
          errorMessage = possibleMessages.find(msg => msg && typeof msg === 'string' && msg.trim() !== '') ||
                        (errorObj.status ? `HTTP Error ${errorObj.status}` : '') ||
                        'Unknown error occurred';
          
          console.error('Selected error message:', errorMessage);
          
          // Handle empty object case specifically
          if (!errorMessage || errorMessage === '{}' || errorMessage === '[object Object]') {
            console.error('Empty or generic error object detected');
            console.error('Full error object details:', {
              errorObj,
              errorObjKeys: Object.keys(errorObj || {}),
              errorObjValues: Object.values(errorObj || {}),
              errorObjEntries: Object.entries(errorObj || {})
            });
            errorMessage = 'Order creation failed. The server returned an empty error response. Please try again or contact support if the issue persists.';
          }
        } else {
          console.error('Error is not an object, string, or Error instance');
          errorMessage = `Unexpected error type: ${typeof error}. Value: ${String(error)}`;
        }
      } catch (processingError) {
        console.error('Error while processing the original error:', processingError);
        errorMessage = 'Failed to process error information. Please try again.';
      }
      
      console.error('=== FINAL ERROR MESSAGE ===');
      console.error('Final error message:', errorMessage);
      
      // Additional safety check for empty error message
      if (!errorMessage || errorMessage.trim() === '' || errorMessage === '{}') {
        console.error('Error message is still empty after processing');
        console.error('Original error for debugging:', {
          error,
          errorType: typeof error,
          errorString: String(error),
          errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        errorMessage = 'Order creation failed. The system encountered an unexpected error. Please try again or contact support if the issue persists.';
      }
      
      console.error('=== END PURCHASE ERROR ===');
      toast.error(errorMessage);
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleContactSeller = async () => {
    if (!user?.id) {
      toast.error("Please log in to contact the seller")
      return
    }

    if (!contactMessage.trim()) {
      toast.error("Please enter a message")
      return
    }

    if (!product) {
      toast.error("Product not found")
      return
    }

    try {
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast.error("Authentication required. Please log in again.")
        return
      }

      // Send message via marketplace messaging API
      const response = await fetch('/api/marketplace/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          recipient_id: product.seller.id,
          content: contactMessage.trim(),
          product_id: product.id,
          message_type: 'text'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      toast.success("Message sent to seller!")
      setShowContactDialog(false)
      setContactMessage("")
      
      // Redirect to marketplace messages with the conversation
      router.push(`/marketplace/messages?user_id=${product.seller.id}&product_id=${product.id}&product_title=${encodeURIComponent(product.title)}`)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    }
  }

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/marketplace">Back to Marketplace</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-800">
              <Image
                src={product.images[currentImageIndex]}
                alt={product.title}
                fill
                className="object-cover"
              />
              
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-75 hover:opacity-100"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-75 hover:opacity-100"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
            
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`aspect-square relative overflow-hidden rounded border-2 ${
                      index === currentImageIndex ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <Image src={image} alt={`${product.title} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {product.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsLiked(!isLiked)}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {renderStars(product.average_rating)}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    {product.average_rating} ({product.reviews_count} reviews)
                  </span>
                </div>
                <Badge variant="outline" className="flex items-center space-x-1">
                  {product.type === 'physical' && <Package className="w-3 h-3" />}
                  {product.type === 'digital' && <Monitor className="w-3 h-3" />}
                  {product.type === 'service' && <Users className="w-3 h-3" />}
                  <span className="capitalize">{product.type}</span>
                </Badge>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${product.price}
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <Leaf className="w-5 h-5" />
                  <span className="font-medium">{product.green_points_price} GP</span>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Pay with Green Points
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Use your earned Green Points from sustainable actions to purchase this item!
                </p>
              </div>
            </div>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={product.seller.avatar_url} alt={product.seller.full_name} />
                    <AvatarFallback>{product.seller.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{product.seller.full_name}</span>
                      {product.seller.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        {renderStars(product.seller.rating)}
                        <span>{product.seller.rating}</span>
                      </div>
                      <span>{product.seller.total_sales} sales</span>
                    </div>
                  </div>
                  <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Contact Seller</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Ask a question about this product..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowContactDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleContactSeller}>
                            Send Message
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Form Dialog */}
            {showShippingForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <ShippingForm
                    onSubmit={handleShippingSubmit}
                    onCancel={() => {
                      setShowShippingForm(false)
                      setPurchaseStep('product')
                    }}
                    isLoading={isPurchasing}
                  />
                </div>
              </div>
            )}

            {/* Stripe Payment Dialog */}
            {showStripePayment && stripeClientSecret && currentOrderId && (
              <StripePaymentForm
                clientSecret={stripeClientSecret}
                orderId={currentOrderId}
                amount={product.price * quantity}
                currency={product.currency}
                productName={product.title}
                onSuccess={() => {
                  setShowStripePayment(false)
                  toast.success('Payment successful! Redirecting to order confirmation...')
                  setTimeout(() => {
                    router.push(`/marketplace/orders/${currentOrderId}`)
                  }, 2000)
                }}
                onCancel={() => {
                  setShowStripePayment(false)
                  setPurchaseStep('product')
                }}
              />
            )}

            {/* Purchase Options - Only show if user is not the seller */}
            {user?.id !== product.seller.id ? (
              <Card>
                <CardContent className="p-4 space-y-4">
                  {product.type === 'physical' && product.stock_quantity !== undefined && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quantity">Quantity</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max={product.stock_quantity}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity!, parseInt(e.target.value) || 1)))}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.min(product.stock_quantity!, quantity + 1))}
                          disabled={quantity >= product.stock_quantity}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={selectedPaymentMethod} onValueChange={(value: 'currency' | 'green_points') => setSelectedPaymentMethod(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="currency">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4" />
                            <span>${(product.price * quantity).toFixed(2)} {product.currency}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="green_points">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-4 h-4 text-green-600" />
                            <span>{product.green_points_price * quantity} Green Points</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleInitiatePurchase()}
                    disabled={isPurchasing || (product.stock_quantity !== undefined && product.stock_quantity <= 0)}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {selectedPaymentMethod === 'green_points' ? 'Buy with Green Points' : 'Buy Now'}
                      </>
                    )}
                  </Button>
                  
                  {product.stock_quantity !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      {product.stock_quantity > 0 ? (
                        `${product.stock_quantity} in stock`
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
                      <Store className="w-5 h-5" />
                      <span className="font-medium">This is your product</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      You cannot purchase your own product. You can manage it from your seller dashboard.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/marketplace/dashboard')}
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {product.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{product.location}</span>
                </div>
              )}
              {product.shipping_info && (
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4" />
                  <span>{product.shipping_info}</span>
                </div>
              )}
              {product.service_duration && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {product.service_duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviews_count})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="prose dark:prose-invert max-w-none">
                  {product.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {product.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sustainability" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-800 dark:text-green-200">
                    Environmental Impact
                  </h3>
                </div>
                
                {product.sustainability_features.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.sustainability_features.map(feature => (
                      <div key={feature} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    No specific sustainability features listed for this product.
                  </p>
                )}
                
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Green Points Reward
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    By purchasing this sustainable product, you'll earn additional Green Points 
                    that can be used for future purchases!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.user.avatar_url} alt={review.user.full_name} />
                          <AvatarFallback>{review.user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{review.user.full_name}</span>
                            {review.verified_purchase && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center space-x-1">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No reviews yet. Be the first to review this product!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}