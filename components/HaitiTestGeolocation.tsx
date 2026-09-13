'use client'

import { useLayoutEffect } from 'react'

const TEST_POSITION: GeolocationPosition = {
  coords: {
    latitude: 19.445677,
    longitude: -72.6907718,
    accuracy: 15,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON: () => ({}),
  },
  timestamp: Date.now(),
  toJSON: () => ({}),
}

const TEST_MODE_KEY = 'taxi-haiti-test-mode'

function isInHaiti(position: GeolocationPosition) {
  const { latitude, longitude } = position.coords
  return latitude >= 17.7 && latitude <= 20.2 && longitude >= -74.7 && longitude <= -71.5
}

export default function HaitiTestGeolocation() {
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    const params = new URLSearchParams(window.location.search)
    const requestedTestMode = params.get('test') === 'haiti'
    const requestedRealMode = params.get('test') === 'off'

    if (requestedRealMode) window.localStorage.removeItem(TEST_MODE_KEY)
    if (requestedTestMode) window.localStorage.setItem(TEST_MODE_KEY, 'haiti')

    const forceTestMode = !requestedRealMode && (
      requestedTestMode || window.localStorage.getItem(TEST_MODE_KEY) === 'haiti'
    )

    const geo = navigator.geolocation
    const originalGetCurrentPosition = geo.getCurrentPosition.bind(geo)
    const originalWatchPosition = geo.watchPosition.bind(geo)

    if (forceTestMode) {
      geo.getCurrentPosition = ((success: PositionCallback) => {
        window.setTimeout(() => success({ ...TEST_POSITION, timestamp: Date.now() }), 0)
      }) as typeof geo.getCurrentPosition

      geo.watchPosition = ((success: PositionCallback) => {
        const id = window.setInterval(() => success({ ...TEST_POSITION, timestamp: Date.now() }), 5000)
        window.setTimeout(() => success({ ...TEST_POSITION, timestamp: Date.now() }), 0)
        return id
      }) as typeof geo.watchPosition
    } else if (!requestedRealMode) {
      geo.getCurrentPosition = ((success: PositionCallback, error?: PositionErrorCallback | null, options?: PositionOptions) => {
        originalGetCurrentPosition(
          (position) => {
            if (isInHaiti(position)) success(position)
            else success({ ...TEST_POSITION, timestamp: Date.now() })
          },
          () => success({ ...TEST_POSITION, timestamp: Date.now() }),
          options,
        )
      }) as typeof geo.getCurrentPosition

      geo.watchPosition = ((success: PositionCallback, error?: PositionErrorCallback | null, options?: PositionOptions) => {
        return originalWatchPosition(
          (position) => {
            if (isInHaiti(position)) success(position)
            else success({ ...TEST_POSITION, timestamp: Date.now() })
          },
          () => success({ ...TEST_POSITION, timestamp: Date.now() }),
          options,
        )
      }) as typeof geo.watchPosition
    }

    return () => {
      geo.getCurrentPosition = originalGetCurrentPosition
      geo.watchPosition = originalWatchPosition
    }
  }, [])

  return null
}
