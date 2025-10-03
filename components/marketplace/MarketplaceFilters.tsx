'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown, MapPin, DollarSign, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface FilterState {
  search: string
  category: string
  type: string[]
  priceRange: [number, number]
  location: string
  sortBy: string
  sustainabilityOnly: boolean
  inStockOnly: boolean
}

interface MarketplaceFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  categories: Array<{ id: string; name: string; count?: number }>
  locations: string[]
  priceRange: [number, number]
  className?: string
  isMobile?: boolean
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' }
]

const PRODUCT_TYPES = [
  { value: 'physical', label: 'Physical Products', icon: '📦' },
  { value: 'digital', label: 'Digital Products', icon: '💻' },
  { value: 'service', label: 'Services', icon: '🛠️' }
]

export function MarketplaceFilters({
  filters,
  onFiltersChange,
  categories,
  locations,
  priceRange,
  className,
  isMobile = false
}: MarketplaceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      category: '',
      type: [],
      priceRange: priceRange,
      location: '',
      sortBy: 'newest',
      sustainabilityOnly: false,
      inStockOnly: false
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (localFilters.search) count++
    if (localFilters.category) count++
    if (localFilters.type.length > 0) count++
    if (localFilters.priceRange[0] > priceRange[0] || localFilters.priceRange[1] < priceRange[1]) count++
    if (localFilters.location) count++
    if (localFilters.sustainabilityOnly) count++
    if (localFilters.inStockOnly) count++
    return count
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search"
            placeholder="Search by title, description..."
            value={localFilters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select value={localFilters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={localFilters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex justify-between items-center w-full">
                  <span>{category.name}</span>
                  {category.count && (
                    <Badge variant="secondary" className="ml-2">
                      {category.count}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Type */}
      <div className="space-y-3">
        <Label>Product Type</Label>
        <div className="space-y-2">
          {PRODUCT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={localFilters.type.includes(type.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFilter('type', [...localFilters.type, type.value])
                  } else {
                    updateFilter('type', localFilters.type.filter(t => t !== type.value))
                  }
                }}
              />
              <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                <span>{type.icon}</span>
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Price Range
        </Label>
        <div className="px-2">
          <Slider
            value={localFilters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
            max={priceRange[1]}
            min={priceRange[0]}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>${localFilters.priceRange[0]}</span>
            <span>${localFilters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location
        </Label>
        <Select value={localFilters.location} onValueChange={(value) => updateFilter('location', value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Additional Filters */}
      <div className="space-y-3">
        <Label>Additional Filters</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sustainability"
              checked={localFilters.sustainabilityOnly}
              onCheckedChange={(checked) => updateFilter('sustainabilityOnly', checked)}
            />
            <Label htmlFor="sustainability" className="flex items-center gap-2 cursor-pointer">
              <Leaf className="w-4 h-4 text-green-600" />
              Eco-friendly only
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={localFilters.inStockOnly}
              onCheckedChange={(checked) => updateFilter('inStockOnly', checked)}
            />
            <Label htmlFor="inStock" className="cursor-pointer">
              In stock only
            </Label>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {getActiveFilterCount() > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Clear All Filters ({getActiveFilterCount()})
        </Button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={localFilters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Filter Products</SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-lg border p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </h3>
        {getActiveFilterCount() > 0 && (
          <Badge variant="secondary">
            {getActiveFilterCount()} active
          </Badge>
        )}
      </div>
      
      <FilterContent />
    </div>
  )
}