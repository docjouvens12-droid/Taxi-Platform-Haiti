import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

function headers(authorization: string) {
  return {
    apikey: supabaseKey,
    Authorization: authorization,
    'Content-Type': 'application/json',
  }
}

async function getJson(url: string, authorization: string) {
  const response = await fetch(url, { headers: headers(authorization), cache: 'no-store' })
  const text = await response.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!response.ok) throw new Error(data?.message || data?.error || `Supabase ${response.status}`)
  return data
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Session manquante.' }, { status: 401 })
  }

  try {
    const user = await getJson(`${supabaseUrl}/auth/v1/user`, authorization)
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 401 })

    const enc = encodeURIComponent
    const [profiles, driverProfiles, vehicles, rides] = await Promise.all([
      getJson(`${supabaseUrl}/rest/v1/profiles?id=eq.${enc(userId)}&select=full_name,phone`, authorization),
      getJson(`${supabaseUrl}/rest/v1/driver_profiles?user_id=eq.${enc(userId)}&select=license_number,national_id_number,preferred_payout_provider,moncash_name,moncash_phone,natcash_name,natcash_phone`, authorization),
      getJson(`${supabaseUrl}/rest/v1/vehicles?driver_id=eq.${enc(userId)}&select=id,vehicle_type,make,model,color,year,plate_number,seats&order=created_at.asc&limit=1`, authorization),
      getJson(`${supabaseUrl}/rest/v1/rides?driver_id=eq.${enc(userId)}&status=eq.completed&select=id,pickup_address,destination_address,final_fare_htg,completed_at&order=completed_at.desc&limit=10`, authorization),
    ])

    const rideRows = Array.isArray(rides) ? rides : []
    let payments: any[] = []
    if (rideRows.length) {
      const ids = rideRows.map((r: any) => r.id).filter(Boolean).join(',')
      if (ids) {
        const pay = await getJson(`${supabaseUrl}/rest/v1/payments?ride_id=in.(${ids})&select=ride_id,amount_htg,platform_fee_htg,driver_net_htg`, authorization)
        payments = Array.isArray(pay) ? pay : []
      }
    }

    const paymentMap = new Map(payments.map((p: any) => [p.ride_id, p]))
    const earnings = rideRows.reduce((acc: { gross:number; fee:number; net:number }, ride: any) => {
      const payment = paymentMap.get(ride.id) as any
      acc.gross += Number(payment?.amount_htg ?? ride.final_fare_htg ?? 0)
      acc.fee += Number(payment?.platform_fee_htg ?? 0)
      acc.net += Number(payment?.driver_net_htg ?? 0)
      return acc
    }, { gross: 0, fee: 0, net: 0 })

    return NextResponse.json({
      email: user?.email ?? '',
      profile: Array.isArray(profiles) ? profiles[0] ?? null : null,
      driver: Array.isArray(driverProfiles) ? driverProfiles[0] ?? null : null,
      vehicle: Array.isArray(vehicles) ? vehicles[0] ?? null : null,
      rides: rideRows,
      earnings,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Impossible de charger le menu chauffeur.' }, { status: 500 })
  }
}
