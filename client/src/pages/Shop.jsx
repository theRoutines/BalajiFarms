import { useEffect, useState } from "react";
import { getProducts } from "../api/productApi.js";
import EmptyState from "../components/common/EmptyState.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import Loader from "../components/common/Loader.jsx";
import Marquee from "../components/common/Marquee.jsx";
import ProductCard from "../components/product/ProductCard.jsx";
import farmHeroImage from "../assets/FarmImage1.png";

export function ShopPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchProducts() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProducts();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-husk/80 shadow-lg min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] flex items-center">
        <img
          src={farmHeroImage}
          alt="Balaji Farms Store"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-espresso/10" />
      </div>

      {/* Infinite Rotation Ticker */}
      <div className="mt-6 rounded-2xl border border-husk/80 bg-white/70 py-2.5 overflow-hidden shadow-xs">
        <Marquee
          speed="30s"
          pauseOnHover={true}
          items={[
            "✨ 100% Direct From Our Dairy Pastures",
            "🚚 Free Delivery On Orders Above ₹999",
            "🧈 Small-Batch Hand Churned Freshness",
            "📦 Safe Chilled Transit Packaging Across India",
            "🌱 Zero Adulteration Guarantee",
          ]}
          separator="•"
          innerClassName="text-xs font-semibold text-espresso/90 tracking-wide"
        />
      </div>

      {/* Content */}
      <div className="mt-10">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader size="lg" text="Harvesting product catalog..." />
          </div>
        ) : error ? (
          <div className="py-8 max-w-xl mx-auto">
            <ErrorMessage
              title="Catalog unavailable"
              message={error}
              onRetry={fetchProducts}
            />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No products available"
              description="Our seasonal farm batches are currently being prepared. Please check back soon!"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopPage;
