import { describe, expect, it } from 'vitest'
import { formatMoney } from '../utils/formatMoney.js'

describe('formatMoney', () => {
  it('formats zero paise correctly', () => {
    expect(formatMoney(0)).toBe('₹0')
  })

  it('formats whole rupee amounts without decimal places', () => {
    expect(formatMoney(49900)).toBe('₹499')
  })

  it('formats rupee amounts with fractional paise using Indian grouping', () => {
    expect(formatMoney(123456)).toBe('₹1,234.56')
  })
})

