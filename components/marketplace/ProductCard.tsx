'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Star, ShoppingCart, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    title: string
    description: string
    price: number
    green_points_price?: number
    type: 'physical' | 'digital' | 'service'
    category: string
    location?: string
    images: string[]
    seller: {
      id: string
      name: string
      avatar_url?: string
      rating?: number
    }
    sustainability_features?: string[]
    stock_quantity?: number
    rating?: number
    review_count?: number
    created_at: string
  }
  viewMode?: 'grid' | 'list'
  showQuickActions?: boolean
  className?: string
}

export function ProductCard({ 
  product, 
  viewMode = 'grid', 
  showQuickActions = true,
  className 
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'physical': return 'bg-blue-100 text-blue-800'
      case 'digital': return 'bg-purple-100 text-purple-800'
      case 'service': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOutOfStock = product.type === 'physical' && product.stock_quantity === 0

  if (viewMode === 'list') {
    return (
      <Card className={cn('flex flex-row overflow-hidden hover:shadow-md transition-shadow', className)}>
        <div className="relative w-48 h-32 flex-shrink-0">
          <Image
            src={imageError ? '/placeholder-product.jpg' : (product.images[0] || '/placeholder-product.jpg')}
            alt={product.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getTypeColor(product.type)}>
                  {product.type}
                </Badge>
                {product.sustainability_features && product.sustainability_features.length > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Leaf className="w-3 h-3 mr-1" />
                    Eco-friendly
                  </Badge>
                )}
              </div>
              
              <Link href={`/marketplace/product/${product.id}`}>
                <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors line-clamp-1">
                  {product.title}
                </h3>
              </Link>
              
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {product.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{product.seller.name}</span>
                  {product.seller.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.seller.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                {product.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{product.location}</span>
                  </div>
                )}
                
                {product.rating && product.review_count && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{product.rating.toFixed(1)} ({product.review_count})</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right ml-4">
              <div className="font-bold text-lg">{formatPrice(product.price)}</div>
              {product.green_points_price && (
                <div className="text-green-600 font-medium">
                  {product.green_points_price} GP
                </div>
              )}
              
              {showQuickActions && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                    className={cn(isLiked && 'text-red-500 border-red-500')}
                  >
                    <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
                  </Button>
                  
                  <Button size="sm" disabled={isOutOfStock}>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow group', className)}>
      <div className="relative aspect-square">
        <Image
          src={imageError ? '/placeholder-product.jpg' : (product.images[0] || '/placeholder-product.jpg')}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
        
        {showQuickActions && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className={cn('bg-white/90 hover:bg-white', isLiked && 'text-red-500')}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            </Button>
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge className={getTypeColor(product.type)}>
            {product.type}
          </Badge>
          
          {product.sustainability_features && product.sustainability_features.length > 0 && (
            <Badge variant="outline" className="bg-white/90 text-green-600 border-green-600">
              <Leaf className="w-3 h-3 mr-1" />
              Eco
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <span className="font-medium">{product.seller.name}</span>
          {product.seller.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{product.seller.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <Link href={`/marketplace/product/${product.id}`}>
          <h3 className="font-semibold hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {product.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">{formatPrice(product.price)}</div>
            {product.green_points_price && (
              <div className="text-green-600 font-medium text-sm">
                {product.green_points_price} GP
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {product.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-20">{product.location}</span>
              </div>
            )}
            
            {product.rating && product.review_count && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {showQuickActions && (
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            disabled={isOutOfStock}
            asChild={!isOutOfStock}
          >
            {isOutOfStock ? (
              'Out of Stock'
            ) : (
              <Link href={`/marketplace/product/${product.id}`}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Details
              </Link>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}