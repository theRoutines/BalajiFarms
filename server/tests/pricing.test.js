import { describe, expect, it } from 'vitest'

import { calculateSubtotal, calculateTotal } from '../src/utils/money.js'

describe('pricing', () => {
  it('calculates subtotal and total in paise', () => {
    expect(calculateSubtotal([
      { unitPricePaise: 49900, quantity: 2 },
      { unitPricePaise: 12500, quantity: 1 },
    ])).toBe(112300)
    expect(calculateTotal(112300, 2500)).toBe(114800)
  })
})
