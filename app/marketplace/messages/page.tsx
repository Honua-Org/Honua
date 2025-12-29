'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/auth-helpers-nextjs'
import MainLayout from '@/components/main-layout'
import { MarketplaceChat, MarketplaceMessageThreads } from '@/components/marketplace/marketplace-chat'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, MessageSquare, Package, ShoppingCart } from 'lucide-react'
import { Suspense } from 'react'

function MarketplaceMessagesContent() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Get URL parameters
  const productId = searchParams.get('product_id')
  const orderId = searchParams.get('order_id')
  const otherUserId = searchParams.get('user_id')
  const productTitle = searchParams.get('product_title')
  const orderNumber = searchParams.get('order_number')

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error getting user:', error)
          router.push('/auth/login')
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('Error in getUser:', error)
        router.push('/auth/login')
      } finally {
        setAuthLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setAuthLoading(false)
      if (!session?.user) {
        router.push('/auth/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Handle query parameters for pre-selecting conversation
   useEffect(() => {
     const userId = searchParams.get('user_id')
     const productId = searchParams.get('product_id')
     
     if (userId && productId) {
       setSelectedThread(userId)
       setSelectedProductId(productId)
     }
   }, [searchParams])

  const handleBackToThreads = () => {
    setSelectedThread(null)
    router.push('/marketplace/messages')
  }

  if (authLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Please log in to access marketplace messages.
              </p>
              <Button onClick={() => router.push('/auth/login')} className="w-full">
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  // If specific conversation parameters are provided, show the chat directly
  if (otherUserId && (productId || orderId)) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToThreads}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Marketplace Messages</h1>
            </div>
          </div>

          <MarketplaceChat
            userId={user.id}
            otherUserId={otherUserId}
            productId={productId || undefined}
            orderId={orderId || undefined}
            productTitle={productTitle || undefined}
            orderNumber={orderNumber || undefined}
          />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Marketplace Messages</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Communicate with buyers and sellers about products and orders.
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>All Messages</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Product Inquiries</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Order Discussions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {selectedThread ? (
              <MarketplaceChat 
                userId={user.id}
                otherUserId={selectedThread}
                productId={selectedProductId || undefined}
                onBack={handleBackToThreads}
              />
            ) : (
              <MarketplaceMessageThreads 
                userId={user.id}
                onSelectThread={(thread) => {
                  setSelectedThread(thread.other_user_id)
                  setSelectedProductId(thread.product_id)
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Product Inquiries</h3>
              <p className="text-muted-foreground">
                Messages about specific products will appear here.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Order Discussions</h3>
              <p className="text-muted-foreground">
                Messages about your orders will appear here.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

export default function MarketplaceMessagesPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    }>
      <MarketplaceMessagesContent />
    </Suspense>
  )
}