'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'category' | 'seller' | 'recent'
  count?: number
  trending?: boolean
}

interface SearchBarProps {
  placeholder?: string
  suggestions?: SearchSuggestion[]
  recentSearches?: string[]
  onSearch?: (query: string) => void
  onSuggestionClick?: (suggestion: SearchSuggestion) => void
  showFilters?: boolean
  onFiltersClick?: () => void
  className?: string
}

const TRENDING_SEARCHES = [
  'sustainable products',
  'eco-friendly',
  'digital services',
  'handmade',
  'local products'
]

export function SearchBar({
  placeholder = 'Search products, services, and more...',
  suggestions = [],
  recentSearches = [],
  onSearch,
  onSuggestionClick,
  showFilters = false,
  onFiltersClick,
  className
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('search') || '')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim()) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    } else {
      setFilteredSuggestions([])
    }
  }, [query, suggestions])

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setIsOpen(false)
    
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      // Default navigation behavior
      const params = new URLSearchParams(searchParams?.toString())
      params.set('search', searchQuery)
      router.push(`/marketplace?${params.toString()}`)
    }

    // Save to recent searches (you might want to implement this with localStorage or API)
    saveRecentSearch(searchQuery)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setIsOpen(false)
    
    if (onSuggestionClick) {
      onSuggestionClick(suggestion)
    } else {
      handleSearch(suggestion.text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const saveRecentSearch = (searchQuery: string) => {
    try {
      const recent = JSON.parse(localStorage.getItem('marketplace_recent_searches') || '[]')
      const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 5)
      localStorage.setItem('marketplace_recent_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }

  const getRecentSearches = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('marketplace_recent_searches') || '[]')
    } catch {
      return []
    }
  }

  const getSuggestionIcon = (type: string, trending?: boolean) => {
    if (trending) return <TrendingUp className="w-4 h-4 text-orange-500" />
    
    switch (type) {
      case 'product': return '📦'
      case 'category': return '📂'
      case 'seller': return '👤'
      case 'recent': return <Clock className="w-4 h-4 text-gray-400" />
      default: return <Search className="w-4 h-4 text-gray-400" />
    }
  }

  const displayRecentSearches = recentSearches.length > 0 ? recentSearches : getRecentSearches()

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-2xl', className)}>
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10 h-12 text-base border-2 focus:border-blue-500"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {showFilters && (
          <Button
            variant="outline"
            onClick={onFiltersClick}
            className="ml-2 h-12 px-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border-2">
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {/* Current query suggestion */}
            {query.trim() && (
              <div className="p-2">
                <button
                  onClick={() => handleSearch()}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <Search className="w-4 h-4 text-blue-500" />
                  <span className="flex-1">
                    Search for "<span className="font-semibold">{query}</span>"
                  </span>
                </button>
              </div>
            )}

            {/* Filtered suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                  Suggestions
                </div>
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {getSuggestionIcon(suggestion.type, suggestion.trending)}
                    </div>
                    <span className="flex-1 truncate">{suggestion.text}</span>
                    {suggestion.count && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Recent searches */}
            {!query.trim() && displayRecentSearches.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                  Recent Searches
                </div>
                {displayRecentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick({ id: `recent-${index}`, text: search, type: 'recent' })}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending searches */}
            {!query.trim() && (
              <div className="p-2">
                <Separator className="my-2" />
                <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                  Trending
                </div>
                {TRENDING_SEARCHES.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick({ id: `trending-${index}`, text: search, type: 'product', trending: true })}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="flex-1 truncate">{search}</span>
                    <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
                      Trending
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {query.trim() && filteredSuggestions.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No suggestions found</p>
                <p className="text-xs">Try searching for products, categories, or sellers</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Compact version for mobile or smaller spaces
export function CompactSearchBar({
  placeholder = 'Search...',
  onSearch,
  className
}: {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
}) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = () => {
    if (!query.trim()) return

    if (onSearch) {
      onSearch(query)
    } else {
      const params = new URLSearchParams(searchParams?.toString())
      params.set('search', query)
      router.push(`/marketplace?${params.toString()}`)
    }
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-9 pr-4 h-10"
        />
      </div>
      <Button
        onClick={handleSearch}
        size="sm"
        className="ml-2 h-10"
        disabled={!query.trim()}
      >
        Search
      </Button>
    </div>
  )
}