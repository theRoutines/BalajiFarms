import { useState } from 'react'
import Button from '../common/Button.jsx'
import FormField from '../common/FormField.jsx'

export function ZoneForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}) {
  const [formData, setFormData] = useState({
    pincode: initialData.pincode || '',
    areaName: initialData.areaName || '',
    deliveryFeeRupees:
      initialData.deliveryFeePaise != null
        ? (initialData.deliveryFeePaise / 100).toString()
        : '0',
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
    if (!isEditing && (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim()))) {
      errors.pincode = 'Pincode must contain exactly 6 digits'
    }
    if (!formData.areaName.trim()) {
      errors.areaName = 'Area or City name is required'
    }
    const fee = parseFloat(formData.deliveryFeeRupees)
    if (isNaN(fee) || fee < 0) {
      errors.deliveryFeeRupees = 'Delivery fee must be a non-negative number'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const deliveryFeePaise = Math.round(parseFloat(formData.deliveryFeeRupees) * 100)

    const payload = {
      areaName: formData.areaName.trim(),
      deliveryFeePaise,
      isActive: formData.isActive,
    }

    if (!isEditing) {
      payload.pincode = formData.pincode.trim()
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {!isEditing && (
        <FormField
          label="Pincode (6 Digits)"
          id="pincode"
          name="pincode"
          required
          maxLength={6}
          value={formData.pincode}
          onChange={handleChange}
          error={fieldErrors.pincode}
          placeholder="110001"
        />
      )}

      <FormField
        label="Area / City Name"
        id="areaName"
        name="areaName"
        required
        value={formData.areaName}
        onChange={handleChange}
        error={fieldErrors.areaName}
        placeholder="New Delhi Central"
      />

      <FormField
        label="Delivery Fee in ₹ (0 for Free Delivery)"
        id="deliveryFeeRupees"
        name="deliveryFeeRupees"
        type="number"
        step="1"
        required
        value={formData.deliveryFeeRupees}
        onChange={handleChange}
        error={fieldErrors.deliveryFeeRupees}
        placeholder="50"
      />

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
          Zone is Active for Delivery
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
          {isEditing ? 'Save Changes' : 'Create Zone'}
        </Button>
      </div>
    </form>
  )
}

export default ZoneForm

