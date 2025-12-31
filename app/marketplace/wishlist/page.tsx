"use client"

import MainLayout from "@/components/main-layout"
import { useWishlist } from "@/hooks/use-wishlist"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type ProductSummary = {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
}

export default function WishlistPage() {
  const { items, remove } = useWishlist()
  const [products, setProducts] = useState<Record<string, ProductSummary>>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) return
      const ids = items.map(i => i.productId)
      const { data } = await supabase
        .from('marketplace_products')
        .select('id,name,price,currency,images')
        .in('id', ids)
      const map: Record<string, ProductSummary> = {}
      for (const p of data || []) map[p.id] = p as ProductSummary
      setProducts(map)
    }
    fetchProducts()
  }, [items])

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4 pb-20 lg:pb-4">
        <h1 className="text-2xl font-bold mb-6">Wishlist</h1>
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">No wishlist items yet.</p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(i => {
              const p = products[i.productId]
              return (
                <Card key={i.productId}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded overflow-hidden border">
                      {p?.images?.[0] ? (
                        <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/marketplace/product/${i.productId}`} className="font-medium hover:underline">
                        {p?.name || i.title || 'Product'}
                      </Link>
                      {p && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">${p.price.toFixed(2)} {p.currency || 'USD'}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild>
                        <Link href={`/marketplace/product/${i.productId}`}>View</Link>
                      </Button>
                      <Button variant="outline" onClick={() => remove(i.productId)}>Remove</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}