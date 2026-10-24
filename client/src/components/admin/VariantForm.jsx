import { useState } from 'react'
import Button from '../common/Button.jsx'
import FormField from '../common/FormField.jsx'

export function VariantForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}) {
  const [formData, setFormData] = useState({
    sku: initialData.sku || '',
    label: initialData.label || '',
    priceRupees: initialData.pricePaise != null ? (initialData.pricePaise / 100).toString() : '',
    stock: initialData.stock != null ? initialData.stock.toString() : '',
    isActive: initialData.isActive !== false,
  })

  const [fieldErrors, setFieldErrors] = useState({})

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errors = {}
    if (!isEditing && (!formData.sku.trim() || formData.sku.trim().length < 1)) {
      errors.sku = 'SKU is required'
    }
    if (!formData.label.trim()) {
      errors.label = 'Label is required (e.g. 500g, 1L)'
    }
    const parsedRupees = parseFloat(formData.priceRupees)
    if (isNaN(parsedRupees) || parsedRupees < 0) {
      errors.priceRupees = 'Price must be a valid positive amount in rupees'
    }
    const parsedStock = parseInt(formData.stock, 10)
    if (isNaN(parsedStock) || parsedStock < 0) {
      errors.stock = 'Stock must be a non-negative integer'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const pricePaise = Math.round(parseFloat(formData.priceRupees) * 100)
    const stock = parseInt(formData.stock, 10)

    const payload = {
      label: formData.label.trim(),
      pricePaise,
      stock,
      isActive: formData.isActive,
    }

    if (!isEditing) {
      payload.sku = formData.sku.trim().toUpperCase()
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {!isEditing && (
        <FormField
          label="SKU Code"
          id="sku"
          name="sku"
          required
          value={formData.sku}
          onChange={handleChange}
          error={fieldErrors.sku}
          placeholder="GHEE-500G"
        />
      )}

      <FormField
        label="Variant Label / Size"
        id="label"
        name="label"
        required
        value={formData.label}
        onChange={handleChange}
        error={fieldErrors.label}
        placeholder="500g or 1L"
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Price in ₹ (Rupees)"
          id="priceRupees"
          name="priceRupees"
          type="number"
          step="0.01"
          required
          value={formData.priceRupees}
          onChange={handleChange}
          error={fieldErrors.priceRupees}
          placeholder="600"
        />

        <FormField
          label="Inventory Stock Units"
          id="stock"
          name="stock"
          type="number"
          required
          value={formData.stock}
          onChange={handleChange}
          error={fieldErrors.stock}
          placeholder="35"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded border-husk text-terracotta focus:ring-terracotta"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-espresso">
          Variant is Active & Purchasable
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-husk">
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
        >
          {isEditing ? 'Update Variant' : 'Add Variant'}
        </Button>
      </div>
    </form>
  )
}

export default VariantForm

