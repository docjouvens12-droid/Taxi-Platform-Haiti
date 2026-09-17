import type { Destination } from '../lib/passenger-destination'

export type RideDestination = {
  destination_address: string
  destination_place_name?: string | null
  destination_formatted_address?: string | null
  destination_latitude?: number | null
  destination_longitude?: number | null
  destination_place_type?: string | null
  destination_confirmation_state?: string | null
  destination_place_id?: string | null
}

export default function PassengerDestinationDetails({ destination, ride, ht = false }: {
  destination?: Destination; ride?: RideDestination; ht?: boolean
}) {
  const name = destination?.placeName ?? ride?.destination_place_name
  const address = destination?.formattedAddress ?? ride?.destination_formatted_address ?? ride?.destination_address
  const lat = destination?.latitude ?? ride?.destination_latitude
  const lng = destination?.longitude ?? ride?.destination_longitude
  const state = destination?.confirmationState ?? ride?.destination_confirmation_state
  return <div className="passenger-destination-details" style={{ display: 'grid', gap: 4, overflowWrap: 'anywhere', whiteSpace: 'normal', padding: '8px 0' }}>
    {name && <strong>{name}</strong>}
    <span>{address}</span>
    {lat != null && lng != null && <small>Latitude: {lat.toFixed(6)} · Longitude: {lng.toFixed(6)}</small>}
    {state && <small>{state === 'map_confirmed' ? (ht ? 'Pwen konfime sou kat la' : 'Point confirmé sur la carte') : (ht ? 'Kote egzak chwazi' : 'Lieu précis sélectionné')}</small>}
  </div>
}
