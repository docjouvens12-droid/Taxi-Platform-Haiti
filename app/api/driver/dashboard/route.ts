import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Session manquante.' }, { status: 401 })
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_my_driver_dashboard`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
    })

    const text = await response.text()
    let payload: any = null
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = { error: text || 'Réponse Supabase invalide.' }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.message || payload?.error || `Supabase ${response.status}` },
        { status: response.status },
      )
    }

    const row = Array.isArray(payload)
      ? payload[0] ?? null
      : payload?.data && Array.isArray(payload.data)
        ? payload.data[0] ?? null
        : payload?.data ?? payload

    if (!row) {
      console.info('[driver-dashboard] no-row', { payloadType: Array.isArray(payload) ? 'array' : typeof payload })
      return NextResponse.json({ error: 'Profil chauffeur introuvable.' }, { status: 404 })
    }

    const driver = {
      full_name: row.full_name ?? null,
      status: row.status ?? null,
      is_online: Boolean(row.is_online),
      average_rating: Number(row.average_rating ?? 0),
      total_rides: Number(row.total_rides ?? 0),
      vehicle_id: row.vehicle_id ?? null,
      vehicle_make: row.vehicle_make ?? null,
      vehicle_model: row.vehicle_model ?? null,
      vehicle_plate_number: row.vehicle_plate_number ?? null,
      vehicle_color: row.vehicle_color ?? null,
    }

    console.info('[driver-dashboard] normalized', {
      hasDriver: true,
      status: driver.status,
      hasName: Boolean(driver.full_name),
      averageRating: driver.average_rating,
      totalRides: driver.total_rides,
      hasVehicle: Boolean(driver.vehicle_id),
    })

    return NextResponse.json(
      { driver, data: [driver] },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('[driver-dashboard] exception', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.' },
      { status: 500 },
    )
  }
}
