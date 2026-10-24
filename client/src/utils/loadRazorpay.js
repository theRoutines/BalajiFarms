let razorpayPromise = null

export function loadRazorpay() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(window.Razorpay)
  }

  if (!razorpayPromise) {
    razorpayPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(window.Razorpay)
      script.onerror = () => {
        razorpayPromise = null
        reject(new Error('Failed to load Razorpay SDK'))
      }
      document.body.appendChild(script)
    })
  }

  return razorpayPromise
}

