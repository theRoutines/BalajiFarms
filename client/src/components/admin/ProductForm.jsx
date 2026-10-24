import { useState, useRef } from 'react'
import Button from '../common/Button.jsx'
import FormField from '../common/FormField.jsx'
import { uploadAdminImage } from '../../api/adminApi.js'

export function ProductForm({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    slug: initialData.slug || '',
    description: initialData.description || '',
    imageUrl: initialData.imageUrl || '',
    isActive: initialData.isActive !== false,
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgressMsg, setUploadProgressMsg] = useState('')
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  function handleNameChange(e) {
    const name = e.target.value
    // If slug is empty or matches auto-generated slug of previous name, keep in sync
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setFormData((prev) => ({
      ...prev,
      name,
      slug: !initialData.id ? autoSlug : prev.slug,
    }))

    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }))
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function compressImageIfNeeded(file, maxDimension = 1600, quality = 0.88) {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
        return
      }

      const img = new Image()
      const reader = new FileReader()

      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = reject

      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
          resolve(reader.result)
          return
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
        const dataUrl = canvas.toDataURL(outputType, quality)
        resolve(dataUrl)
      }

      img.onerror = () => {
        resolve(reader.result)
      }

      reader.readAsDataURL(file)
    })
  }

  async function handleFileUpload(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: 'Please select a valid image file (PNG, JPG, WEBP, etc.)',
      }))
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: 'Image file size must be less than 25MB',
      }))
      return
    }

    try {
      setIsUploading(true)
      setUploadProgressMsg('Optimizing image...')
      const base64Data = await compressImageIfNeeded(file)

      setUploadProgressMsg('Uploading to Cloudinary...')
      const res = await uploadAdminImage(base64Data)
      const uploadedUrl =
        res?.url || res?.data?.url || res?.data?.data?.url || (typeof res === 'string' ? res : null)
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }))
        setFieldErrors((prev) => ({ ...prev, imageUrl: '' }))
      } else {
        throw new Error('No image URL returned from upload server')
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to upload image. Please check credentials or try again.'
      setFieldErrors((prev) => ({ ...prev, imageUrl: errorMsg }))
    } finally {
      setIsUploading(false)
      setUploadProgressMsg('')
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function validate() {
    const errors = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters'
    }
    if (!formData.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
      errors.slug = 'Slug must be lowercase alphanumeric with hyphens (e.g. pure-cow-ghee)'
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    if (!formData.imageUrl.trim()) {
      errors.imageUrl = 'Please upload a product image'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
      isActive: formData.isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="Product Name"
        id="name"
        name="name"
        required
        value={formData.name}
        onChange={handleNameChange}
        error={fieldErrors.name}
        placeholder="Pure Cow Ghee"
      />

      <FormField
        label="URL Slug"
        id="slug"
        name="slug"
        required
        value={formData.slug}
        onChange={handleChange}
        error={fieldErrors.slug}
        placeholder="pure-cow-ghee"
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-xs font-semibold uppercase tracking-wider text-espresso/80"
        >
          Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          value={formData.description}
          onChange={handleChange}
          placeholder="Traditional bilona-style cow ghee made in small batches."
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-espresso transition focus:outline-none focus:ring-2 focus:ring-terracotta/20 ${
            fieldErrors.description ? 'border-rose-400' : 'border-husk'
          }`}
        />
        {fieldErrors.description && (
          <p className="text-xs text-rose-600">{fieldErrors.description}</p>
        )}
      </div>

      {/* Product Image Section with Cloudinary Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-espresso/80">
          Product Image <span className="text-rose-500">*</span>
        </label>

        {formData.imageUrl ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-husk bg-[#FBF7EE]/60">
            <div className="relative group overflow-hidden rounded-xl border border-sand/40 bg-white shadow-xs w-28 h-28 shrink-0">
              <img
                src={formData.imageUrl}
                alt="Product Preview"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/images/ghee.jpg'
                }}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {formData.imageUrl.includes('cloudinary') ? 'Cloudinary Hosted' : 'Image Ready'}
                </span>
              </div>
              <p className="text-xs text-espresso/70 truncate max-w-sm font-mono bg-white/70 px-2.5 py-1 rounded border border-husk/70">
                {formData.imageUrl}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-semibold text-terracotta hover:text-terracotta-dark px-3 py-1.5 rounded-lg border border-terracotta/30 hover:bg-terracotta/5 transition"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  disabled={isUploading}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              isDragOver
                ? 'border-terracotta bg-terracotta/5'
                : 'border-husk hover:border-terracotta/60 bg-stone-50/50 hover:bg-stone-50'
            } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <svg
                  className="animate-spin h-8 w-8 text-terracotta"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <p className="text-sm font-semibold text-espresso">
                  {uploadProgressMsg || 'Uploading to Cloudinary...'}
                </p>
                <p className="text-xs text-espresso/60">Optimizing and storing on Cloudinary CDN</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-full bg-sand/20 text-terracotta flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-espresso">
                  Click to upload or drag & drop product image
                </div>
                <p className="text-xs text-espresso/60">
                  PNG, JPG, WEBP, or AVIF (up to 10MB) • Uploads automatically to Cloudinary
                </p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleFileChange}
          className="hidden"
        />

        {fieldErrors.imageUrl && (
          <p className="text-xs text-rose-600 mt-1">{fieldErrors.imageUrl}</p>
        )}

        {/* Small toggle to view or edit manual URL if desired */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-[11px] text-espresso/60 hover:text-espresso underline transition"
          >
            {showManualUrl ? 'Hide manual URL input' : 'Or enter custom image URL directly'}
          </button>
          {showManualUrl && (
            <div className="mt-2">
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://... or /images/ghee.jpg"
                className="w-full rounded-xl border border-husk bg-white px-3 py-2 text-xs text-espresso font-mono focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              />
            </div>
          )}
        </div>
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
          Product is Active & Visible in Store
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
          isLoading={isSubmitting || isUploading}
        >
          {initialData.id ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}

export default ProductForm
