import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrderTimeline } from '../components/orders/OrderTimeline.jsx'

describe('OrderTimeline', () => {
  it('shows all five steps and marks steps up to the current status as done', () => {
    const history = [
      { toStatus: 'PENDING_PAYMENT', createdAt: '2026-10-16T10:00:00Z' },
      { toStatus: 'PAID', createdAt: '2026-10-16T10:05:00Z' },
      { toStatus: 'PACKED', createdAt: '2026-10-16T10:30:00Z' },
    ]

    render(<OrderTimeline status="PACKED" history={history} />)

    // Verify all 5 steps are displayed
    expect(screen.getByText('Pending Payment')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('Packed')).toBeInTheDocument()
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument()
    expect(screen.getByText('Delivered')).toBeInTheDocument()

    // Steps 1, 2, 3 should have active/completed styling
    const stepPending = screen.getByTestId('timeline-step-PENDING_PAYMENT')
    const stepPaid = screen.getByTestId('timeline-step-PAID')
    const stepPacked = screen.getByTestId('timeline-step-PACKED')
    const stepOut = screen.getByTestId('timeline-step-OUT_FOR_DELIVERY')

    expect(stepPending.querySelector('.bg-terracotta')).toBeInTheDocument()
    expect(stepPaid.querySelector('.bg-terracotta')).toBeInTheDocument()
    expect(stepPacked.querySelector('.bg-terracotta')).toBeInTheDocument()
    expect(stepOut.querySelector('.bg-terracotta')).not.toBeInTheDocument()
  })

  it('shows the banner for CANCELLED', () => {
    render(<OrderTimeline status="CANCELLED" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Order Cancelled')).toBeInTheDocument()
    expect(screen.queryByText('Pending Payment')).not.toBeInTheDocument()
  })

  it('shows the banner for EXPIRED', () => {
    render(<OrderTimeline status="EXPIRED" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Order Expired')).toBeInTheDocument()
    expect(screen.queryByText('Pending Payment')).not.toBeInTheDocument()
  })
})

