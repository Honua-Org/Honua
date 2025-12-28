'use client'

import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type ProductActionsProps = {
  product: {
    id: string
    title: string
    price: number
    currency: string
    images?: string[]
    seller: {
      id: string
    }
  }
  quantity: number
  isLiked: boolean
  onToggleWishlist: () => void
}

export function ProductActions({ product, quantity, isLiked, onToggleWishlist }: ProductActionsProps) {
  const { addItem } = useCart()
  const { has, toggle } = useWishlist()
  const [justAdded, setJustAdded] = useState(false)
  const supabase = createClientComponentClient()

  const handleAddToCart = async () => {
    try {
      const requestedQty = Math.max(1, quantity)
      const { data: stockAvailable, error: stockError } = await supabase
        .rpc('check_stock_availability', {
          p_product_id: product.id,
          p_quantity: requestedQty
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

      addItem({
        productId: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        image: product.images?.[0],
        sellerId: product.seller.id,
        quantity: requestedQty
      })
      setJustAdded(true)
      toast.success("Added to cart")
      setTimeout(() => setJustAdded(false), 2000)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error("Failed to add to cart")
    }
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleAddToCart}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {justAdded ? 'Added!' : 'Add to Cart'}
      </Button>
      <Button
        onClick={onToggleWishlist}
        variant="outline"
        className={`p-3 ${isLiked ? 'text-red-500 border-red-500' : 'text-gray-500'}`}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
      </Button>
      <Button variant="outline" asChild>
        <Link href="/marketplace/cart">View Cart</Link>
      </Button>
    </div>
  )
}
