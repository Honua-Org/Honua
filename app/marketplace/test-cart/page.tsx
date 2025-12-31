"use client"

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function TestCartPage() {
  const { items, addItem, clear } = useCart()
  const [testResults, setTestResults] = useState<string[]>([])

  const runCartTest = () => {
    const results = []
    
    try {
      console.log('Starting cart test...')
      results.push('Cart test started')
      
      // Test 1: Check if addItem exists
      if (typeof addItem === 'function') {
        results.push('✅ addItem function exists')
      } else {
        results.push('❌ addItem function missing')
        return
      }
      
      // Test 2: Add an item
      const testItem = {
        productId: 'test-product-123',
        title: 'Test Product',
        price: 19.99,
        currency: 'USD',
        quantity: 1
      }
      
      console.log('Adding test item:', testItem)
      addItem(testItem)
      results.push('✅ Item added successfully')
      
      // Test 3: Check if item appears in cart
      setTimeout(() => {
        console.log('Current cart items:', items)
        if (items.length > 0) {
          results.push(`✅ Cart contains ${items.length} item(s)`)
          results.push(`✅ First item: ${items[0].title}`)
        } else {
          results.push('⚠️ Cart appears empty (may need time to update)')
        }
      }, 100)
      
    } catch (error) {
      console.error('Cart test failed:', error)
      results.push(`❌ Error: ${error}`)
    }
    
    setTestResults(results)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Cart Functionality Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Current Cart Status:</h2>
          <p>Items in cart: {items.length}</p>
          {items.length > 0 && (
            <div>
              <h3 className="font-medium mt-2">Cart Items:</h3>
              {items.map((item, index) => (
                <div key={index} className="text-sm mt-1">
                  {item.title} - ${item.price} (Qty: {item.quantity})
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button onClick={runCartTest} className="bg-blue-600 hover:bg-blue-700">
          Run Cart Test
        </Button>
        
        <Button onClick={clear} variant="outline" className="ml-2">
          Clear Cart
        </Button>
        
        {testResults.length > 0 && (
          <div className="p-4 bg-gray-50 rounded mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm mb-1">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}