'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { toast } from 'sonner'

export default function CartWishlistControls({
  productId,
  title,
  price,
  currency,
  image,
  sellerId,
  quantity,
}: {
  productId: string
  title: string
  price: number
  currency: string
  image?: string
  sellerId?: string
  quantity: number
}) {
  const { addItem } = useCart()
  const { has, toggle } = useWishlist()
  const liked = has(productId)

  const addToCart = () => {
    addItem({ productId, title, price, currency, image, sellerId, quantity: Math.max(1, quantity) })
    toast.success('Added to cart')
  }

  const toggleWishlist = () => {
    toggle({ productId, title, image })
    toast.success(liked ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={addToCart}>
        Add to Cart
      </Button>
      <Button variant="outline" asChild>
        <Link href="/marketplace/cart">View Cart</Link>
      </Button>
      <Button variant="ghost" onClick={toggleWishlist}>
        {liked ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </Button>
    </div>
  )
}