import { useState } from 'react'
import Button from '../common/Button.jsx'
import FormField from '../common/FormField.jsx'

export function CattleForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}) {
  const [formData, setFormData] = useState({
    tagId: initialData.tagId || '',
    type: initialData.type || 'COW',
    breed: initialData.breed || 'Gir',
    category: initialData.category || 'MILKING',
    isActive: initialData.isActive !== false,
  })

  const [fieldErrors, setFieldErrors] = useState({})

  const cattleBreeds = ['Gir', 'Sahiwal', 'Rathi', 'Holstein Friesian']
  const cowCategories = [
    { value: 'MILKING', label: 'Milking (Active Lactation)' },
    { value: 'DRY', label: 'Dry (Resting Period)' },
    { value: 'PREGNANT', label: 'Pregnant (Expecting Mother)' },
    { value: 'HEIFER', label: 'Heifer (Young Female)' },
  ]

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }
      // If type changed away from COW, reset category to null
      if (name === 'type' && value !== 'COW') {
        updated.category = ''
      }
      if (name === 'type' && value === 'COW' && !updated.category) {
        updated.category = 'MILKING'
      }
      return updated
    })
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errors = {}
    if (!isEditing && !formData.tagId.trim()) {
      errors.tagId = 'Tag ID is required (e.g. COW-025)'
    }
    if (!formData.breed.trim()) {
      errors.breed = 'Breed name is required'
    }
    if (formData.type === 'COW' && !formData.category) {
      errors.category = 'Cows must have an active category assigned'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      type: formData.type,
      breed: formData.breed.trim(),
      category: formData.type === 'COW' ? formData.category : null,
      isActive: formData.isActive,
    }

    if (!isEditing) {
      payload.tagId = formData.tagId.trim().toUpperCase()
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {!isEditing && (
        <FormField
          label="Cattle Tag ID"
          id="tagId"
          name="tagId"
          required
          value={formData.tagId}
          onChange={handleChange}
          error={fieldErrors.tagId}
          placeholder="COW-025 or BULL-004"
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="type"
            className="text-xs font-semibold uppercase tracking-wider text-espresso/80"
          >
            Animal Type <span className="text-rose-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full rounded-xl border border-husk bg-white px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          >
            <option value="COW">Cow</option>
            <option value="BULL">Bull</option>
            <option value="CALF">Calf</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="breed"
            className="text-xs font-semibold uppercase tracking-wider text-espresso/80"
          >
            Heritage Breed <span className="text-rose-500">*</span>
          </label>
          <select
            id="breed"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            className="w-full rounded-xl border border-husk bg-white px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/20"
          >
            {cattleBreeds.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formData.type === 'COW' && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="category"
            className="text-xs font-semibold uppercase tracking-wider text-espresso/80"
          >
            Cow Category (Required for Cows) <span className="text-rose-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta/20 ${
              fieldErrors.category ? 'border-rose-400' : 'border-husk'
            }`}
          >
            {cowCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="text-xs text-rose-600">{fieldErrors.category}</p>
          )}
        </div>
      )}

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
          Animal is Active in Herd (Uncheck to Retire)
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
          {isEditing ? 'Update Cattle Record' : 'Register Animal'}
        </Button>
      </div>
    </form>
  )
}

export default CattleForm

