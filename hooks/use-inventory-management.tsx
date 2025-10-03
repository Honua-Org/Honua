'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  product_id: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  low_stock_threshold: number
  reorder_point: number
  last_updated: string
}

interface StockMovement {
  id: string
  product_id: string
  movement_type: 'in' | 'out' | 'reserved' | 'released'
  quantity: number
  reason: string
  reference_id?: string
  created_at: string
}

export function useInventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  // Fetch inventory for user's products
  const fetchInventory = async (sellerId?: string) => {
    setLoading(true)
    try {
      let query = supabase
        .from('marketplace_inventory')
        .select(`
          *,
          marketplace_products!inner(
            id,
            title,
            seller_id
          )
        `)

      if (sellerId) {
        query = query.eq('marketplace_products.seller_id', sellerId)
      }

      const { data, error } = await query.order('last_updated', { ascending: false })

      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch stock movements for a product
  const fetchStockMovements = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('marketplace_stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setStockMovements(data || [])
    } catch (error) {
      console.error('Error fetching stock movements:', error)
      toast.error('Failed to fetch stock movements')
    }
  }

  // Update stock levels
  const updateStock = async (productId: string, quantity: number, movementType: 'in' | 'out', reason: string, referenceId?: string) => {
    try {
      // First, get current inventory
      const { data: currentInventory, error: fetchError } = await supabase
        .from('marketplace_inventory')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (fetchError) {
        // If no inventory record exists, create one
        if (fetchError.code === 'PGRST116') {
          const { error: createError } = await supabase
            .from('marketplace_inventory')
            .insert({
              product_id: productId,
              current_stock: movementType === 'in' ? quantity : 0,
              reserved_stock: 0,
              available_stock: movementType === 'in' ? quantity : 0,
              low_stock_threshold: 10,
              reorder_point: 5
            })

          if (createError) throw createError
        } else {
          throw fetchError
        }
      } else {
        // Update existing inventory
        let newCurrentStock = currentInventory.current_stock
        let newAvailableStock = currentInventory.available_stock

        if (movementType === 'in') {
          newCurrentStock += quantity
          newAvailableStock += quantity
        } else if (movementType === 'out') {
          newCurrentStock -= quantity
          newAvailableStock -= quantity
        }

        // Ensure stock doesn't go negative
        if (newCurrentStock < 0) {
          throw new Error('Insufficient stock available')
        }

        const { error: updateError } = await supabase
          .from('marketplace_inventory')
          .update({
            current_stock: newCurrentStock,
            available_stock: newAvailableStock,
            last_updated: new Date().toISOString()
          })
          .eq('product_id', productId)

        if (updateError) throw updateError
      }

      // Record stock movement
      const { error: movementError } = await supabase
        .from('marketplace_stock_movements')
        .insert({
          product_id: productId,
          movement_type: movementType,
          quantity: quantity,
          reason: reason,
          reference_id: referenceId
        })

      if (movementError) throw movementError

      toast.success(`Stock ${movementType === 'in' ? 'added' : 'removed'} successfully`)
      return true
    } catch (error: any) {
      console.error('Error updating stock:', error)
      toast.error(error.message || 'Failed to update stock')
      return false
    }
  }

  // Reserve stock for an order
  const reserveStock = async (productId: string, quantity: number, orderId: string) => {
    try {
      const { data: currentInventory, error: fetchError } = await supabase
        .from('marketplace_inventory')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (fetchError) throw fetchError

      if (currentInventory.available_stock < quantity) {
        throw new Error('Insufficient stock available for reservation')
      }

      const { error: updateError } = await supabase
        .from('marketplace_inventory')
        .update({
          reserved_stock: currentInventory.reserved_stock + quantity,
          available_stock: currentInventory.available_stock - quantity,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)

      if (updateError) throw updateError

      // Record stock movement
      await supabase
        .from('marketplace_stock_movements')
        .insert({
          product_id: productId,
          movement_type: 'reserved',
          quantity: quantity,
          reason: 'Stock reserved for order',
          reference_id: orderId
        })

      return true
    } catch (error: any) {
      console.error('Error reserving stock:', error)
      toast.error(error.message || 'Failed to reserve stock')
      return false
    }
  }

  // Release reserved stock (e.g., when order is cancelled)
  const releaseReservedStock = async (productId: string, quantity: number, orderId: string) => {
    try {
      const { data: currentInventory, error: fetchError } = await supabase
        .from('marketplace_inventory')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (fetchError) throw fetchError

      const { error: updateError } = await supabase
        .from('marketplace_inventory')
        .update({
          reserved_stock: Math.max(0, currentInventory.reserved_stock - quantity),
          available_stock: currentInventory.available_stock + quantity,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)

      if (updateError) throw updateError

      // Record stock movement
      await supabase
        .from('marketplace_stock_movements')
        .insert({
          product_id: productId,
          movement_type: 'released',
          quantity: quantity,
          reason: 'Reserved stock released',
          reference_id: orderId
        })

      return true
    } catch (error: any) {
      console.error('Error releasing reserved stock:', error)
      toast.error(error.message || 'Failed to release reserved stock')
      return false
    }
  }

  // Confirm stock usage (e.g., when order is shipped)
  const confirmStockUsage = async (productId: string, quantity: number, orderId: string) => {
    try {
      const { data: currentInventory, error: fetchError } = await supabase
        .from('marketplace_inventory')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (fetchError) throw fetchError

      const { error: updateError } = await supabase
        .from('marketplace_inventory')
        .update({
          reserved_stock: Math.max(0, currentInventory.reserved_stock - quantity),
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)

      if (updateError) throw updateError

      // Record stock movement
      await supabase
        .from('marketplace_stock_movements')
        .insert({
          product_id: productId,
          movement_type: 'out',
          quantity: quantity,
          reason: 'Stock confirmed for shipped order',
          reference_id: orderId
        })

      return true
    } catch (error: any) {
      console.error('Error confirming stock usage:', error)
      toast.error(error.message || 'Failed to confirm stock usage')
      return false
    }
  }

  // Get low stock alerts
  const getLowStockAlerts = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('marketplace_inventory')
        .select(`
          *,
          marketplace_products!inner(
            id,
            title,
            seller_id
          )
        `)
        .eq('marketplace_products.seller_id', sellerId)
        .filter('available_stock', 'lt', 'low_stock_threshold')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching low stock alerts:', error)
      return []
    }
  }

  // Update stock thresholds
  const updateStockThresholds = async (productId: string, lowStockThreshold: number, reorderPoint: number) => {
    try {
      const { error } = await supabase
        .from('marketplace_inventory')
        .update({
          low_stock_threshold: lowStockThreshold,
          reorder_point: reorderPoint,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)

      if (error) throw error
      toast.success('Stock thresholds updated successfully')
      return true
    } catch (error) {
      console.error('Error updating stock thresholds:', error)
      toast.error('Failed to update stock thresholds')
      return false
    }
  }

  return {
    inventory,
    stockMovements,
    loading,
    fetchInventory,
    fetchStockMovements,
    updateStock,
    reserveStock,
    releaseReservedStock,
    confirmStockUsage,
    getLowStockAlerts,
    updateStockThresholds
  }
}