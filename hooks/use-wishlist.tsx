'use client'

import React, { useEffect, useState } from 'react'

type WishlistItem = {
  productId: string
  title?: string
  image?: string
}

const STORAGE_KEY = 'marketplace_wishlist'

// Create a singleton wishlist state that works across components
let globalWishlistState: WishlistItem[] = []
let globalWishlistListeners: (() => void)[] = []

const notifyWishlistListeners = () => {
  globalWishlistListeners.forEach(listener => listener())
}

const setGlobalWishlistState = (newState: WishlistItem[] | ((prev: WishlistItem[]) => WishlistItem[])) => {
  if (typeof newState === 'function') {
    globalWishlistState = newState(globalWishlistState)
  } else {
    globalWishlistState = newState
  }
  notifyWishlistListeners()
  
  // Persist to localStorage if available
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalWishlistState))
    } catch {}
  }
}

export function useWishlist() {
  // Use a more robust client-side detection
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    // Mark as client-side and load from localStorage
    setIsClient(true)
    
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        globalWishlistState = parsed
        setItems(parsed)
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error)
    }
    
    // Subscribe to global state changes
    const listener = () => {
      setItems(globalWishlistState)
    }
    globalWishlistListeners.push(listener)
    
    return () => {
      const index = globalWishlistListeners.indexOf(listener)
      if (index > -1) globalWishlistListeners.splice(index, 1)
    }
  }, [])

  const toggle = (entry: WishlistItem) => {
    setGlobalWishlistState(prev => {
      const exists = prev.find(i => i.productId === entry.productId)
      if (exists) return prev.filter(i => i.productId !== entry.productId)
      return [...prev, entry]
    })
  }

  const remove = (productId: string) => setGlobalWishlistState(prev => prev.filter(i => i.productId !== productId))

  const has = (productId: string) => items.some(i => i.productId === productId)

  // Always return the current state, even if not fully initialized
  return { 
    items: isClient ? items : [], 
    toggle, 
    remove, 
    has 
  }
}