export function calculateSubtotal(lines) {
  return lines.reduce((subtotalPaise, line) => {
    const unitPricePaise = line.unitPricePaise ?? line.pricePaise
    return subtotalPaise + unitPricePaise * line.quantity
  }, 0)
}

export function calculateTotal(subtotalPaise, deliveryFeePaise) {
  return subtotalPaise + deliveryFeePaise
}

export function formatRupees(paise) {
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
