import { createContext, useContext, useEffect, useState } from 'react'

export const CartContext = createContext(null)

const CART_STORAGE_KEY = 'dairy_cart'

function loadSavedCart() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadSavedCart)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage write issues
    }
  }, [items])

  function addItem(newItem) {
    if (!newItem || !newItem.variantId) return

    setItems((previousItems) => {
      const existingIndex = previousItems.findIndex(
        (item) => item.variantId === newItem.variantId,
      )

      const availableStock =
        typeof newItem.maxStock === 'number' ? newItem.maxStock : 10
      const quantityToAdd = newItem.quantity || 1

      if (existingIndex > -1) {
        const existing = previousItems[existingIndex]
        const mergedQuantity = Math.min(
          10,
          availableStock,
          existing.quantity + quantityToAdd,
        )

        const updated = [...previousItems]
        updated[existingIndex] = {
          ...existing,
          ...newItem,
          quantity: Math.max(1, mergedQuantity),
          maxStock: availableStock,
        }
        return updated
      }

      const initialQuantity = Math.min(
        10,
        availableStock,
        Math.max(1, quantityToAdd),
      )

      return [
        ...previousItems,
        {
          variantId: newItem.variantId,
          productName: newItem.productName,
          variantLabel: newItem.variantLabel,
          imageUrl: newItem.imageUrl,
          pricePaise: newItem.pricePaise,
          quantity: initialQuantity,
          maxStock: availableStock,
        },
      ]
    })
  }

  function updateQuantity(variantId, targetQuantity) {
    if (targetQuantity <= 0) {
      removeItem(variantId)
      return
    }

    setItems((previousItems) =>
      previousItems.map((item) => {
        if (item.variantId !== variantId) return item
        const maxLimit = Math.min(10, item.maxStock ?? 10)
        const capped = Math.min(maxLimit, Math.max(1, targetQuantity))
        return { ...item, quantity: capped }
      }),
    )
  }

  function removeItem(variantId) {
    setItems((previousItems) =>
      previousItems.filter((item) => item.variantId !== variantId),
    )
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalPaise = items.reduce(
    (sum, item) => sum + item.pricePaise * item.quantity,
    0,
  )

  const value = {
    items,
    itemCount,
    subtotalPaise,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

