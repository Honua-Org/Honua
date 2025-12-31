'use client'

import React, { useEffect, useState } from "react"

type CartItem = {
  productId: string
  title: string
  price: number
  currency: string
  image?: string
  sellerId?: string
  quantity: number
}

const STORAGE_KEY = 'marketplace_cart'

// Create a singleton cart state that works across components
let globalCartState: CartItem[] = []
let globalListeners: (() => void)[] = []

const notifyListeners = () => {
  globalListeners.forEach(listener => listener())
}

const setGlobalCartState = (newState: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
  if (typeof newState === 'function') {
    globalCartState = newState(globalCartState)
  } else {
    globalCartState = newState
  }
  notifyListeners()
  
  // Persist to localStorage if available
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalCartState))
      console.log('Cart saved to localStorage:', globalCartState.length, 'items')
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }
}

export function useCart() {
  // Use a more robust client-side detection
  const [items, setItems] = useState<CartItem[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  
  
  useEffect(() => {
    // Mark as client-side and load from localStorage
    setIsClient(true)
    
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      
      if (raw) {
        const parsed = JSON.parse(raw)
        
        globalCartState = parsed
        setItems(parsed)
      } else {
        
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    } finally {
      setIsLoading(false)
    }
    
    // Subscribe to global state changes
    const listener = () => {
      setItems(globalCartState)
    }
    globalListeners.push(listener)
    
    return () => {
      const index = globalListeners.indexOf(listener)
      if (index > -1) globalListeners.splice(index, 1)
    }
  }, [])

  const addItem = (item: CartItem) => {
    
    setGlobalCartState(prev => {
      const existing = prev.find(i => i.productId === item.productId)
      if (existing) {
        const newState = prev.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i)
        return newState
      }
      const newState = [...prev, item]
      return newState
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setGlobalCartState(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i))
  }

  const removeItem = (productId: string) => {
    setGlobalCartState(prev => prev.filter(i => i.productId !== productId))
  }

  const clear = () => {
    
    setGlobalCartState([])
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Always return the current state, even if not fully initialized
  return { 
    items: isClient ? items : [], 
    addItem, 
    updateQuantity, 
    removeItem, 
    clear, 
    total,
    isLoading 
  }
}
