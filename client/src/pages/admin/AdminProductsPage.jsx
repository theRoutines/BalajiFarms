import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  createAdminProduct,
  createAdminVariant,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
  updateAdminVariant,
} from '../../api/adminApi.js'
import ProductForm from '../../components/admin/ProductForm.jsx'
import VariantForm from '../../components/admin/VariantForm.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx'
import Loader from '../../components/common/Loader.jsx'
import Modal from '../../components/common/Modal.jsx'
import { formatMoney } from '../../utils/formatMoney.js'

export function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productToDelete, setProductToDelete] = useState(null)
  const [addVariantProductId, setAddVariantProductId] = useState(null)
  const [editingVariant, setEditingVariant] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function fetchProducts() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAdminProducts()
      setProducts(data.products || [])
    } catch (err) {
      setError(err.message || 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Product Handlers
  async function handleCreateProduct(payload) {
    try {
      setIsSubmitting(true)
      await createAdminProduct(payload)
      toast.success('Product created!')
      setIsAddProductOpen(false)
      fetchProducts()
    } catch (err) {
      toast.error(err.message || 'Could not create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateProduct(payload) {
    if (!editingProduct) return
    try {
      setIsSubmitting(true)
      await updateAdminProduct(editingProduct.id, payload)
      toast.success('Product updated!')
      setEditingProduct(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.message || 'Could not update product')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProduct() {
    if (!productToDelete) return
    try {
      setIsSubmitting(true)
      await deleteAdminProduct(productToDelete.id)
      toast.success(`Product "${productToDelete.name}" deleted successfully!`)
      setProductToDelete(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.message || 'Could not delete product')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Variant Handlers
  async function handleCreateVariant(payload) {
    if (!addVariantProductId) return
    try {
      setIsSubmitting(true)
      await createAdminVariant(addVariantProductId, payload)
      toast.success('Variant added!')
      setAddVariantProductId(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.message || 'Could not add variant')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateVariant(payload) {
    if (!editingVariant) return
    try {
      setIsSubmitting(true)
      await updateAdminVariant(editingVariant.id, payload)
      toast.success('Variant updated!')
      setEditingVariant(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.message || 'Could not update variant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-husk pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta">
            Inventory & Catalog
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-espresso">
            Products & Variants
          </h1>
          <p className="mt-1 text-xs text-espresso/60">
            Manage small-batch farm products, SKU configurations, pricing, and live inventory
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddProductOpen(true)}
          className="self-start sm:self-auto"
        >
          + Add New Product
        </Button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchProducts} />}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" text="Loading product catalog..." />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-husk bg-white p-12 text-center text-espresso/60">
          No products found. Click &quot;Add New Product&quot; to begin your catalog.
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-husk bg-white p-6 shadow-sm transition hover:border-sand"
            >
              {/* Product Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-husk/50">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl border border-husk bg-cream flex-shrink-0">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      aspectRatio="aspect-square"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-espresso">
                        {product.name}
                      </h3>
                      {!product.isActive && (
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-espresso/60 font-mono">
                      /{product.slug}
                    </p>
                    <p className="text-xs text-espresso/80 line-clamp-1 mt-1">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(product)}
                    className="rounded-lg border border-husk px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-cream"
                  >
                    Edit Product
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddVariantProductId(product.id)}
                  >
                    + Add Variant
                  </Button>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(product)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition inline-flex items-center gap-1.5"
                    title="Delete product permanently"
                  >
                    <svg className="h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Delete Product
                  </button>
                </div>
              </div>

              {/* Variants Sub-table */}
              <div className="mt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-espresso/60 block mb-2">
                  Active Variants ({product.variants?.length || 0})
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-husk/40 text-espresso/50 uppercase">
                        <th className="py-2 font-semibold">SKU</th>
                        <th className="py-2 font-semibold">Label</th>
                        <th className="py-2 font-semibold">Price</th>
                        <th className="py-2 font-semibold">Stock</th>
                        <th className="py-2 font-semibold">Status</th>
                        <th className="py-2 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-husk/30">
                      {product.variants?.map((v) => (
                        <tr key={v.id} className="hover:bg-cream/40 transition">
                          <td className="py-2.5 font-mono font-semibold text-espresso">
                            {v.sku}
                          </td>
                          <td className="py-2.5 font-semibold text-espresso">
                            {v.label}
                          </td>
                          <td className="py-2.5 font-bold text-terracotta">
                            {formatMoney(v.pricePaise)}
                          </td>
                          <td className="py-2.5 font-bold text-espresso">
                            <span
                              className={`rounded px-1.5 py-0.5 ${
                                v.stock <= 5
                                  ? 'bg-amber-100 text-amber-900 font-bold'
                                  : 'text-espresso'
                              }`}
                            >
                              {v.stock} units
                            </span>
                          </td>
                          <td className="py-2.5">
                            {v.isActive ? (
                              <span className="text-forest font-semibold">Active</span>
                            ) : (
                              <span className="text-rose-600 font-semibold">Disabled</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingVariant(v)}
                              className="text-xs font-semibold text-terracotta hover:underline"
                            >
                              Edit Price & Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Create New Farm Product"
      >
        <ProductForm
          onSubmit={handleCreateProduct}
          onCancel={() => setIsAddProductOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Edit Product: ${editingProduct?.name}`}
      >
        {editingProduct && (
          <ProductForm
            initialData={editingProduct}
            onSubmit={handleUpdateProduct}
            onCancel={() => setEditingProduct(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        isOpen={!!addVariantProductId}
        onClose={() => setAddVariantProductId(null)}
        title="Add Product Variant"
      >
        <VariantForm
          onSubmit={handleCreateVariant}
          onCancel={() => setAddVariantProductId(null)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Variant Modal */}
      <Modal
        isOpen={!!editingVariant}
        onClose={() => setEditingVariant(null)}
        title={`Edit Variant: ${editingVariant?.label} (${editingVariant?.sku})`}
      >
        {editingVariant && (
          <VariantForm
            initialData={editingVariant}
            isEditing
            onSubmit={handleUpdateVariant}
            onCancel={() => setEditingVariant(null)}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Product Confirmation Modal */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Confirm Delete Product"
      >
        {productToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-espresso/80">
              Are you sure you want to permanently delete{' '}
              <strong className="text-espresso font-bold font-display text-base">{productToDelete.name}</strong>?
            </p>
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>⚠️</span> Irreversible Action
              </p>
              <p>
                This product and all its configured size variants will be permanently deleted from the database and storefront.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-husk/50">
              <Button
                variant="outline"
                size="md"
                onClick={() => setProductToDelete(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminProductsPage

