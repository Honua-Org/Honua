'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  const supabase = createClientComponentClient()

  const addToCart = async () => {
    try {
      const requestedQty = Math.max(1, quantity)
      const { data: stockAvailable, error: stockError } = await supabase
        .rpc('check_stock_availability', {
          p_product_id: productId,
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

      addItem({ productId, title, price, currency, image, sellerId, quantity: requestedQty })
      toast.success('Added to cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    }
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
