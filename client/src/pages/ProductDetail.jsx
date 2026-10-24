import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProductBySlug } from '../api/productApi.js'
import Button from '../components/common/Button.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import ImageWithFallback from '../components/common/ImageWithFallback.jsx'
import Loader from '../components/common/Loader.jsx'
import QuantityStepper from '../components/common/QuantityStepper.jsx'
import VariantSelector from '../components/product/VariantSelector.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatMoney } from '../utils/formatMoney.js'

export function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchProduct() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getProductBySlug(slug)
        if (isMounted) {
          const fetchedProduct = data.product
          setProduct(fetchedProduct)

          // Select first available variant with stock, or first variant
          const activeVariants = fetchedProduct?.variants?.filter((v) => v.isActive !== false) || []
          const inStockVariant = activeVariants.find((v) => v.stock > 0)
          setSelectedVariant(inStockVariant || activeVariants[0] || null)
          setQuantity(1)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Product not found')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (slug) {
      fetchProduct()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  function handleAddToCart() {
    if (!product || !selectedVariant) return

    if (selectedVariant.stock <= 0) {
      toast.error('This variant is currently out of stock')
      return
    }

    addItem({
      variantId: selectedVariant.id,
      productName: product.name,
      variantLabel: selectedVariant.label,
      imageUrl: product.imageUrl,
      pricePaise: selectedVariant.pricePaise,
      quantity,
      maxStock: selectedVariant.stock,
    })

    toast.success(`Added ${product.name} (${selectedVariant.label}) to cart!`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" text="Loading product details..." />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <ErrorMessage
          title="Product Unavailable"
          message={error || 'We could not find the product you requested.'}
        />
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream"
        >
          Return to Shop
        </Link>
      </div>
    )
  }

  const activeVariants = product.variants?.filter((v) => v.isActive !== false) || []
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0
  const maxAllowedQuantity = selectedVariant ? Math.min(10, selectedVariant.stock) : 1

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-charcoal/60">
        <Link to="/" className="hover:text-forest">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-forest">
          Shop
        </Link>
        <span>/</span>
        <span className="font-semibold text-forest truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: Product Image */}
        <div className="overflow-hidden rounded-3xl border border-forest/15 bg-white p-6 shadow-sm">
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.name}
            aspectRatio="aspect-square"
            className="w-full rounded-2xl"
          />
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">
            100% Pure & Natural
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-forest sm:text-4xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-forest">
              {selectedVariant ? formatMoney(selectedVariant.pricePaise) : '—'}
            </span>
            <span className="text-xs text-charcoal/60">
              (Includes all taxes)
            </span>
          </div>

          {/* Description */}
          <div className="mt-6 border-t border-forest/10 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/80">
              About this farm produce
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
              {product.description}
            </p>
          </div>

          {/* Variant Selector */}
          <div className="mt-8 border-t border-forest/10 pt-6">
            <VariantSelector
              variants={activeVariants}
              selectedVariant={selectedVariant}
              onSelect={(variant) => {
                setSelectedVariant(variant)
                setQuantity(1)
              }}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="mt-8 border-t border-forest/10 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/80">
                  Qty:
                </span>
                <QuantityStepper
                  quantity={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={maxAllowedQuantity}
                  disabled={isOutOfStock}
                />
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full sm:w-auto flex-1"
              >
                {isOutOfStock ? 'Currently Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>

          {/* Farm Guarantees */}
          <div className="mt-10 rounded-2xl border border-forest/10 bg-cream/50 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 text-charcoal/80">
                <span className="text-forest">✓</span>
                <span>Direct cold-chain farm delivery</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal/80">
                <span className="text-forest">✓</span>
                <span>Free from chemical preservatives</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal/80">
                <span className="text-forest">✓</span>
                <span>Glass & tin food-grade packaging</span>
              </div>
              <div className="flex items-center gap-2 text-charcoal/80">
                <span className="text-forest">✓</span>
                <span>Verified customer OTP handover</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage

