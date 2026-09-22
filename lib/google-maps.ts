let googleMapsPromise: Promise<any> | null = null

declare global {
  interface Window {
    google?: any
    __moviGoogleMapsInit?: () => void
  }
}

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google)
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing')
    )
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-movi-google-maps="true"]'
    )

 if (existingScript) {
  existingScript.remove()
}   

  window.__moviGoogleMapsInit = () => {
  if (window.google?.maps) {
    resolve(window.google)
  } else {
    googleMapsPromise = null
    reject(new Error('Google Maps initialized incorrectly'))
  }
}  
    
    const language =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_LANGUAGE || 'fr'

    const region =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_REGION || 'HT'

    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      language,
      region,
      callback: '__moviGoogleMapsInit',
      loading: 'async',
    })

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.dataset.moviGoogleMaps = 'true'

    script.onerror = () => {
  googleMapsPromise = null
  script.remove()
  reject(new Error('Unable to load Google Maps JavaScript API'))
}
    

    document.head.appendChild(script)
  })
  return googleMapsPromise
}

 
