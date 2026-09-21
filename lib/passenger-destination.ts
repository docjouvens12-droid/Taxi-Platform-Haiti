export type Point = { lat: number; lng: number }
export type Destination = {
  placeId: string | null
  placeName: string
  formattedAddress: string
  latitude: number
  longitude: number
  placeType: string
  confirmationState: 'exact_place' | 'needs_map_confirmation' | 'map_confirmed'
}

// A road, city, unknown type, or interpolated address is never an exact stop.
export function isExactPlaceType(type: string) {
  return ['address', 'street_address', 'premise', 'subpremise', 'poi', 'point_of_interest', 'establishment'].includes(type)
}

export function isHaitiPoint(point: Point) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) && point.lat >= 17.8 && point.lat <= 20.1 && point.lng >= -74.7 && point.lng <= -71.5
}

export function destinationReady(value: Destination | null): value is Destination {
  return !!value &&
    !!value.placeName.trim() && !!value.formattedAddress.trim() &&
    (value.confirmationState === 'map_confirmed' ||
      (value.confirmationState === 'exact_place' && isExactPlaceType(value.placeType)))
}

export type DestinationResult = {
  id: string; label: string; center: [number, number]; featureType?: string
  placeName?: string; formattedAddress?: string; requiresMapConfirmation?: boolean
}

export function destinationFromResult(result: DestinationResult): Destination {
  const placeType = result.featureType || 'unknown'
  return {
    placeId: result.id || null,
    placeName: result.placeName?.trim() || result.label.split(',')[0].trim(),
    formattedAddress: result.formattedAddress?.trim() || result.label,
    latitude: result.center[1], longitude: result.center[0], placeType,
    confirmationState: isExactPlaceType(placeType) && !result.requiresMapConfirmation ? 'exact_place' : 'needs_map_confirmation',
  }
}

export function destinationRpcFields(value: Destination) {
  if (!destinationReady(value)) throw new Error('DESTINATION_CONFIRMATION_REQUIRED')
  return {
    p_destination_address: value.formattedAddress,
    p_destination_latitude: value.latitude,
    p_destination_longitude: value.longitude,
    p_destination_place_name: value.placeName,
    p_destination_formatted_address: value.formattedAddress,
    p_destination_place_type: value.placeType,
    p_destination_confirmation_state: value.confirmationState,
    p_destination_place_id: value.placeId,
  }
}
