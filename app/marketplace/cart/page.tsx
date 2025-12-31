"use client"

import MainLayout from "@/components/main-layout"
import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear, total } = useCart()
  const router = useRouter()

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Your Cart</h1>
          </div>
          {items.length > 0 && (
            <Button variant="outline" onClick={clear}>Clear Cart</Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Your cart is empty.</p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <Card key={item.productId}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded overflow-hidden border">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/marketplace/product/${item.productId}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.currency} ${item.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                      />
                      <Button variant="outline" onClick={() => removeItem(item.productId)}>Remove</Button>
                      <Button asChild>
                        <Link href={`/marketplace/product/${item.productId}`}>Buy Now</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Items</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/marketplace/checkout">
                    Proceed to Checkout
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}