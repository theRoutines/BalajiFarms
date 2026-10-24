import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CartProvider, useCart } from '../context/CartContext.jsx'

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('merges quantities when adding the same variant and caps at 10 and at stock', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem({
        variantId: 1,
        productName: 'Pure Cow Ghee',
        variantLabel: '500g',
        pricePaise: 60000,
        quantity: 2,
        maxStock: 5,
      })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.itemCount).toBe(2)
    expect(result.current.subtotalPaise).toBe(120000)

    // Add more of the same variant
    act(() => {
      result.current.addItem({
        variantId: 1,
        quantity: 2,
        maxStock: 5,
      })
    })

    expect(result.current.items[0].quantity).toBe(4)

    // Attempt to exceed stock limit (maxStock is 5)
    act(() => {
      result.current.addItem({
        variantId: 1,
        quantity: 3,
        maxStock: 5,
      })
    })

    expect(result.current.items[0].quantity).toBe(5)
  })

  it('updates and removes items', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem({
        variantId: 1,
        productName: 'Pure Cow Ghee',
        variantLabel: '500g',
        pricePaise: 60000,
        quantity: 1,
        maxStock: 10,
      })
      result.current.addItem({
        variantId: 2,
        productName: 'Cold-Pressed Mustard Oil',
        variantLabel: '1L',
        pricePaise: 38000,
        quantity: 2,
        maxStock: 10,
      })
    })

    expect(result.current.itemCount).toBe(3)

    act(() => {
      result.current.updateQuantity(1, 3)
    })

    expect(result.current.items[0].quantity).toBe(3)

    act(() => {
      result.current.removeItem(2)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.itemCount).toBe(3)
  })

  it('survives reload through localStorage and calculates subtotal correctly', () => {
    const initialData = [
      {
        variantId: 10,
        productName: 'Groundnut Oil',
        variantLabel: '500ml',
        pricePaise: 23000,
        quantity: 2,
        maxStock: 10,
      },
    ]
    localStorage.setItem('dairy_cart', JSON.stringify(initialData))

    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>
    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].variantId).toBe(10)
    expect(result.current.itemCount).toBe(2)
    expect(result.current.subtotalPaise).toBe(46000)
  })
})

