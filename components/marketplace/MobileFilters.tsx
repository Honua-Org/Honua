"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter, ChevronDown, ChevronUp, Grid3X3, List } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
  count: number
}

interface MobileFiltersProps {
  categories: Category[]
  selectedCategory: string
  selectedType: string
  sortBy: string
  viewMode: 'grid' | 'list'
  onCategoryChange: (value: string) => void
  onTypeChange: (value: string) => void
  onSortChange: (value: string) => void
  onViewModeChange: (mode: 'grid' | 'list') => void
  onClearFilters: () => void
  activeFilterCount: number
}

export function MobileFilters({
  categories,
  selectedCategory,
  selectedType,
  sortBy,
  viewMode,
  onCategoryChange,
  onTypeChange,
  onSortChange,
  onViewModeChange,
  onClearFilters,
  activeFilterCount
}: MobileFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getCategoryName = (categoryId: string) => {
    if (categoryId === "all") return "All Categories"
    const category = categories.find(c => c.id === categoryId)
    return category ? `${category.icon} ${category.name}` : categoryId
  }

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      all: "All Types",
      physical: "Physical",
      digital: "Digital", 
      service: "Service"
    }
    return typeMap[type] || type
  }

  const getSortLabel = (sort: string) => {
    const sortMap: { [key: string]: string } = {
      newest: "Newest First",
      "price-low": "Price: Low to High",
      "price-high": "Price: High to Low",
      sustainability: "Most Sustainable"
    }
    return sortMap[sort] || sort
  }

  return (
    <div className="lg:hidden mb-4">
      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-sm text-gray-600"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Collapsible Filter Content */}
      {isExpanded && (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {getCategoryName(selectedCategory)}
                  <button
                    onClick={() => onCategoryChange("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedType !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  {getTypeLabel(selectedType)}
                  <button
                    onClick={() => onTypeChange("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {sortBy !== "newest" && (
                <Badge variant="secondary" className="text-xs">
                  {getSortLabel(sortBy)}
                  <button
                    onClick={() => onSortChange("newest")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                      <span className="text-gray-500 ml-auto">({category.count})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sort by</label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="sustainability">Most Sustainable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">View Mode</label>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="flex-1"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="flex-1"
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}