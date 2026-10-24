import { describe, expect, it } from 'vitest'

import { canTransition, getAllowedNextStatuses } from '../src/utils/orderStateMachine.js'

describe('order state machine', () => {
  it('allows every documented transition', () => {
    expect(canTransition('PENDING_PAYMENT', 'PAID')).toBe(true)
    expect(canTransition('PENDING_PAYMENT', 'CANCELLED')).toBe(true)
    expect(canTransition('PENDING_PAYMENT', 'EXPIRED')).toBe(true)
    expect(canTransition('PAID', 'PACKED')).toBe(true)
    expect(canTransition('PAID', 'CANCELLED')).toBe(true)
    expect(canTransition('PACKED', 'OUT_FOR_DELIVERY')).toBe(true)
    expect(canTransition('PACKED', 'CANCELLED')).toBe(true)
    expect(canTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true)
  })

  it('rejects illegal and final-state transitions', () => {
    expect(canTransition('PAID', 'PENDING_PAYMENT')).toBe(false)
    expect(canTransition('PENDING_PAYMENT', 'PACKED')).toBe(false)
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false)
    expect(canTransition('CANCELLED', 'PAID')).toBe(false)
    expect(canTransition('EXPIRED', 'PAID')).toBe(false)
  })

  it('returns the documented next statuses', () => {
    expect(getAllowedNextStatuses('PENDING_PAYMENT')).toEqual(['PAID', 'CANCELLED', 'EXPIRED'])
    expect(getAllowedNextStatuses('PAID')).toEqual(['PACKED', 'CANCELLED'])
    expect(getAllowedNextStatuses('PACKED')).toEqual(['OUT_FOR_DELIVERY', 'CANCELLED'])
    expect(getAllowedNextStatuses('OUT_FOR_DELIVERY')).toEqual(['DELIVERED'])
    expect(getAllowedNextStatuses('DELIVERED')).toEqual([])
  })
})
