import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest/10 text-4xl text-forest">
        🌾
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-gold">
        404 Error
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-forest sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-sm text-charcoal/70">
        It seems you have wandered off the farm path. The page you are looking for does not exist or may have been relocated.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream shadow-sm hover:bg-forest/90"
        >
          Return Home
        </Link>
        <Link
          to="/shop"
          className="rounded-full border border-forest/30 px-6 py-2.5 text-sm font-semibold text-forest hover:bg-forest/5"
        >
          Browse Farm Store
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage

