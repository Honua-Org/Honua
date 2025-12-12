"use client"

import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/hooks/use-cart"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

type ShippingForm = {
  full_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

export default function CheckoutPage() {
  const { items, total, clear, isLoading } = useCart()
  const [shipping, setShipping] = useState<ShippingForm>({
    full_name: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if cart is loaded and empty
    if (!isLoading && items.length === 0) {
      router.push('/marketplace')
    }
  }, [items.length, isLoading, router])

  const onSubmit = async () => {
    if (!shipping.full_name || !shipping.address_line1 || !shipping.city || !shipping.state || !shipping.postal_code || !shipping.country) {
      toast.error('Please complete all required shipping fields')
      return
    }
    setSubmitting(true)
    
    const orderResults = []
    let hasErrors = false
    
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      if (!token) {
        toast.error('You must be logged in to place an order')
        setSubmitting(false)
        return
      }

      // Process each item individually to better handle errors
      console.log('Starting order processing for items:', items.map(item => ({
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        sellerId: item.sellerId,
        currency: item.currency
      })))
      
      for (const item of items) {
        try {
          console.log(`Processing order for ${item.title}...`)
          const requestBody = {
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            payment_method: 'stripe',
            shipping_address: shipping,
            currency: item.currency || 'USD'
          }
          console.log(`Request body for ${item.title}:`, requestBody)
          
          const res = await fetch('/api/marketplace/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody)
          })
          
          let result
          try {
            result = await res.json()
          } catch (jsonError) {
            console.error(`Failed to parse JSON response for ${item.title}:`, jsonError)
            const textResponse = await res.text()
            console.error(`Raw response for ${item.title}:`, textResponse)
            orderResults.push({
              item: item.title,
              success: false,
              error: `Server returned invalid response: ${textResponse}`,
              details: `HTTP ${res.status}: ${res.statusText}`
            })
            hasErrors = true
            continue
          }
          
          if (!res.ok) {
            console.error(`Order failed for ${item.title}:`, {
              status: res.status,
              statusText: res.statusText,
              error: result?.error ?? null,
              message: result?.message ?? null,
              details: result?.details ?? null
            })
            orderResults.push({
              item: item.title,
              success: false,
              error: result?.error || `Server error (${res.status})`,
              details: result?.details || result?.message || 'No additional details provided'
            })
            hasErrors = true
          } else {
            orderResults.push({
              item: item.title,
              success: true,
              order: result.order
            })
          }
        } catch (itemError) {
          console.error(`Exception processing ${item.title}:`, itemError)
          orderResults.push({
            item: item.title,
            success: false,
            error: 'Network or processing error'
          })
          hasErrors = true
        }
      }

      // Show summary of results
      const successfulOrders = orderResults.filter(r => r.success)
      const failedOrders = orderResults.filter(r => !r.success)
      
      if (successfulOrders.length > 0) {
        toast.success(`Successfully created ${successfulOrders.length} order(s)`)
      }
      
      if (failedOrders.length > 0) {
        failedOrders.forEach(failed => {
          console.error(`Order failed for ${failed.item}:`, failed)
          toast.error(`Failed to order ${failed.item}: ${failed.error}${failed.details ? ` (${failed.details})` : ''}`)
        })
      }
      
      // If we have successful orders, clear cart and redirect
      if (successfulOrders.length > 0) {
        clear()
        router.push('/marketplace/orders')
      } else if (hasErrors) {
        // If all orders failed, stay on page and show error summary
        toast.error('All orders failed. Please check the errors above and try again.')
      }
      
    } catch (err: any) {
      console.error('Critical error in checkout process:', err)
      toast.error(err?.message || 'Failed to process checkout')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading state while cart initializes
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto p-4 pb-24 lg:pb-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading checkout...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-4 pb-24 lg:pb-8">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" value={shipping.full_name} onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input id="address_line1" value={shipping.address_line1} onChange={(e) => setShipping({ ...shipping, address_line1: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input id="address_line2" value={shipping.address_line2 || ''} onChange={(e) => setShipping({ ...shipping, address_line2: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input id="state" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input id="postal_code" value={shipping.postal_code} onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Items</span>
              <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
            <Button className="w-full mt-4" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}