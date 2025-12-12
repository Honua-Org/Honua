'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Package, Laptop, Wrench, Leaf, TrendingUp, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  product_count: number
  icon?: string
  color?: string
  trending?: boolean
  sustainability_focused?: boolean
}

interface CategoryGridProps {
  categories: Category[]
  showAll?: boolean
  maxItems?: number
  className?: string
  layout?: 'carousel' | 'grid'
}

const UNSPLASH_IMAGES = {
  'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&crop=center',
  'clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
  'home': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop&crop=center',
  'books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
  'sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
  'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop&crop=center',
  'automotive': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop&crop=center',
  'toys': 'https://images.unsplash.com/photo-1558877385-1c2b8f8b6e8b?w=400&h=300&fit=crop&crop=center',
  'food': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop&crop=center',
  'health': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center',
  'services': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop&crop=center',
  'digital': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center',
  'sustainability': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop&crop=center',
  'education': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop&crop=center',
  'art': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&crop=center',
  'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&crop=center',
  'garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center',
  'consulting': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
  'technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center',
  'transportation': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center'
}

const getImageForCategory = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  for (const [key, image] of Object.entries(UNSPLASH_IMAGES)) {
    if (name.includes(key)) return image
  }
  
  // Default image for unknown categories
  return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&crop=center'
}

const getColorForCategory = (categoryName: string, customColor?: string) => {
  if (customColor) return customColor
  
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-red-100 text-red-800 border-red-200'
  ]
  
  const hash = categoryName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

export function CategoryGrid({ 
  categories, 
  showAll = false, 
  maxItems = 8,
  className,
  layout = 'carousel'
}: CategoryGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // Responsive items per view: 2 on mobile, 3 on tablet, 4 on desktop
  const [itemsPerView, setItemsPerView] = useState(4)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth
      if (width < 640) {
        setItemsPerView(2)
        setIsMobile(true)
      } else if (width < 1024) {
        setItemsPerView(3)
        setIsMobile(false)
      } else {
        setItemsPerView(4)
        setIsMobile(false)
      }
    }
    
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])
  
  const maxIndex = Math.max(0, categories.length - itemsPerView)
  
  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex))
  }
  
  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }
  
  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex))
  }

  // Mobile Grid Layout
  if (layout === 'grid' && isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="grid grid-cols-2 gap-2">
          {categories.slice(0, showAll ? categories.length : maxItems).map((category) => {
            const backgroundImage = getImageForCategory(category.name)
            
            return (
              <Link key={category.id} href={`/marketplace?category=${category.slug}`}>
                <Card className="group hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer border-0 overflow-hidden h-20">
                  <div 
                    className="relative w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                  >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-200" />
                    
                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-end p-2 text-white">
                      {/* Badges - More compact */}
                      <div className="absolute top-1 right-1 flex gap-1">
                        {category.trending && (
                          <div className="bg-red-500/90 text-white text-xs px-1 py-0.5 rounded backdrop-blur-sm">
                            <TrendingUp className="w-2 h-2" />
                          </div>
                        )}
                        
                        {category.sustainability_focused && (
                          <div className="bg-green-500/90 text-white text-xs px-1 py-0.5 rounded backdrop-blur-sm">
                            <Leaf className="w-2 h-2" />
                          </div>
                        )}
                      </div>
                      
                      {/* Category Info - More compact */}
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-xs group-hover:text-blue-200 transition-colors line-clamp-1">
                          {category.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-200">
                            {category.product_count}
                          </span>
                          
                          <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-200 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
        
        {!showAll && categories.length > maxItems && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {}}
            className="w-full justify-center text-xs h-8"
          >
            +{categories.length - maxItems} More
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {categories.length > itemsPerView && (
          <>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 backdrop-blur-sm shadow-lg hover:bg-gray-900 text-white border-gray-700 hover:border-gray-600 ${
                isMobile ? 'w-10 h-10 rounded-full' : ''
              }`}
              onClick={prevSlide}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            </Button>
            
            <Button
              variant="outline"
              size={isMobile ? "sm" : "icon"}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 backdrop-blur-sm shadow-lg hover:bg-gray-900 text-white border-gray-700 hover:border-gray-600 ${
                isMobile ? 'w-10 h-10 rounded-full' : ''
              }`}
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
            >
              <ChevronRight className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            </Button>
          </>
        )}
        
        {/* Carousel Track */}
        <div className="overflow-hidden rounded-lg">
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
          >
            {categories.map((category) => {
              const backgroundImage = getImageForCategory(category.name)
              
              return (
                <div key={category.id} className={`flex-shrink-0 px-2 ${isMobile ? 'w-1/2' : 'w-1/4'}`}>
                  <Link href={`/marketplace?category=${category.slug}`}>
                    <Card className={`group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-0 overflow-hidden ${
                      isMobile ? 'h-32' : 'h-48'
                    }`}>
                      <div 
                        className="relative w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${backgroundImage})` }}
                      >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
                        
                        {/* Content */}
                        <div className="relative h-full flex flex-col justify-end p-3 text-white">
                          {/* Badges */}
                          <div className={`absolute right-2 flex gap-1 ${isMobile ? 'top-2' : 'top-3'}`}>
                            {category.trending && (
                              <Badge className={`bg-red-500/90 text-white backdrop-blur-sm ${
                                isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
                              }`}>
                                <TrendingUp className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1`} />
                                {!isMobile && 'Hot'}
                              </Badge>
                            )}
                            
                            {category.sustainability_focused && (
                              <Badge className={`bg-green-500/90 text-white backdrop-blur-sm ${
                                isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'
                              }`}>
                                <Leaf className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} mr-1`} />
                                {!isMobile && 'Eco'}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Category Info */}
                          <div className="space-y-1">
                            <h3 className={`font-bold group-hover:text-blue-200 transition-colors line-clamp-2 ${
                              isMobile ? 'text-base' : 'text-lg'
                            }`}>
                              {category.name}
                            </h3>
                            
                            {category.description && !isMobile && (
                              <p className="text-sm text-gray-200 line-clamp-2 opacity-90">
                                {category.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className={`bg-white/20 text-white border-white/30 backdrop-blur-sm ${
                                isMobile ? 'text-xs px-2 py-0.5' : ''
                              }`}>
                                {category.product_count} {isMobile ? '' : 'items'}
                              </Badge>
                              
                              <div className={`rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors ${
                                isMobile ? 'w-6 h-6' : 'w-8 h-8'
                              }`}>
                                <ChevronRight className={`text-gray-300 group-hover:text-blue-200 transition-colors ${
                                  isMobile ? 'w-3 h-3' : 'w-4 h-4'
                                }`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Dots Indicator */}
        {categories.length > itemsPerView && (
          <div className={`flex justify-center gap-2 ${isMobile ? 'mt-3' : 'mt-4'}`}>
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  'rounded-full transition-colors duration-200',
                  currentIndex === index 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 hover:bg-gray-400',
                  isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'
                )}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Empty state */}
      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Categories Available
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Categories will appear here once products are added to the marketplace.
          </p>
        </div>
      )}
    </div>
  )
}

// Compact version for sidebars or smaller spaces
export function CategoryList({ 
  categories, 
  maxItems = 6,
  className 
}: CategoryGridProps) {
  const [showAll, setShowAll] = useState(false)
  
  const displayedCategories = showAll 
    ? categories 
    : categories.slice(0, maxItems)
  
  const hasMore = categories.length > maxItems

  return (
    <div className={cn('space-y-2', className)}>
      {displayedCategories.map((category) => {
        const backgroundImage = getImageForCategory(category.name)
        
        return (
          <Link key={category.id} href={`/marketplace?category=${category.slug}`}>
            <div className="relative overflow-hidden rounded-lg hover:shadow-md transition-all duration-200 group cursor-pointer h-16">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
              
              {/* Content */}
              <div className="relative h-full flex items-center justify-between p-3 text-white">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-sm group-hover:text-blue-200 transition-colors">
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-200 opacity-90">
                      {category.product_count} items
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {category.trending && (
                    <TrendingUp className="w-3 h-3 text-red-400" />
                  )}
                  {category.sustainability_focused && (
                    <Leaf className="w-3 h-3 text-green-400" />
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-200 transition-colors" />
                </div>
              </div>
            </div>
          </Link>
        )
      })}
      
      {hasMore && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full justify-center text-sm"
        >
          {showAll ? 'Show Less' : `Show ${categories.length - maxItems} More`}
        </Button>
      )}
    </div>
  )
}