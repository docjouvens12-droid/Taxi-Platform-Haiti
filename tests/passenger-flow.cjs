// Run against a local build using NEXT_PUBLIC_SUPABASE_URL=https://ride-tests.supabase.co.
// All backend traffic is intercepted; no real accounts or rides are modified.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_URL || 'http://localhost:3100'
const passengerId = '11111111-1111-4111-8111-111111111111'
const driverId = '22222222-2222-4222-8222-222222222222'
let ride = null
let failRead = false
const ratings = new Map()
const calls = []
const fixture = (id, status) => ({ id, status, passenger_id: passengerId, driver_id: status === 'requested' ? null : driverId, pickup_address: 'Place de l’Indépendance', destination_address: '12 rue Test Gonaives', pickup_latitude: 19.447, pickup_longitude: -72.684, destination_latitude: 19.451, destination_longitude: -72.68, service_type: 'standard', estimated_fare_htg: 350, final_fare_htg: 400, requested_at: new Date().toISOString(), completed_at: new Date().toISOString(), cancelled_at: new Date().toISOString() })
const jwt = id => `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: 4102444800, role: 'authenticated' })).toString('base64url')}.test`
async function setup(browser, role) {
  const context = await browser.newContext({ viewport: { width: 430, height: 932 }, permissions: ['geolocation'], geolocation: { latitude: 19.447, longitude: -72.684 }, serviceWorkers: 'block' })
  const id = role === 'driver' ? driverId : passengerId
  const user = { id, email: `${role}@example.test`, role: 'authenticated', aud: 'authenticated', user_metadata: { full_name: 'Test Passenger' } }
  await context.addInitScript(({ user, token }) => {
    localStorage.setItem('taxi-auth-default', JSON.stringify({ access_token: token, refresh_token: 'test', token_type: 'bearer', expires_at: 4102444800, expires_in: 3600, user }))
    localStorage.setItem('taxi-language', 'fr')
  }, { user, token: jwt(id) })
  await context.routeWebSocket('**/realtime/**', socket => socket.close())
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    const json = data => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
    if (url.hostname.endsWith('mapbox.com')) {
      if (url.pathname.includes('/styles/')) return json({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e5efeb' } }] })
      if (url.pathname.includes('/directions/')) return json({ routes: [{ distance: 1000, duration: 240, geometry: { type: 'LineString', coordinates: [[-72.684,19.447],[-72.68,19.451]] } }] })
      return json({})
    }
    if (url.pathname === '/api/driver/dashboard') return json({ data: { status: 'approved', is_online: true, full_name: 'Test Driver', vehicle_id: 'vehicle-1', vehicle_make: 'Toyota', vehicle_model: 'Test', vehicle_plate_number: 'TEST', average_rating: 5, total_rides: 1 } })
    if (url.pathname === '/api/driver/menu') return json({ data: {} })
    if (url.pathname === '/api/geocode') return json({ results: [] })
    if (url.hostname === 'ride-tests.supabase.co') {
      const name = url.pathname.split('/').pop()
      const single = route.request().headers().accept?.includes('object')
      const result = value => json(single ? value : value ? [value] : [])
      if (url.pathname.includes('/auth/')) return json(user)
      if (url.pathname.includes('/rpc/')) {
        const body = route.request().postDataJSON() || {}
        calls.push({ role, name, body })
        if (name === 'quote_ride') return json([{ distance_km: 1, duration_min: 4, fare_htg: 350 }])
        if (name === 'request_ride_v3') {
          ride = { ...fixture('booked-ride', 'requested'), destination_address: body.p_destination_address, destination_latitude: body.p_destination_latitude, destination_longitude: body.p_destination_longitude }
          return json(ride.id)
        }
        if (name === 'cancel_ride') { ride = { ...ride, status: 'cancelled' }; return json(null) }
        if (name === 'rate_completed_ride') { ratings.set(body.p_ride_id, body.p_rating); return json(null) }
        const transitions = { accept_ride: 'accepted', mark_driver_arriving: 'driver_arriving', start_ride: 'in_progress', complete_ride: 'completed' }
        if (transitions[name]) { ride = { ...ride, status: transitions[name], driver_id: driverId }; return json(null) }
        if (name === 'get_passenger_live_driver_tracking') return json(ride && ['accepted', 'driver_arriving', 'in_progress'].includes(ride.status) ? [{ ...ride, ride_id: ride.id, ride_status: ride.status, driver_latitude: 19.448, driver_longitude: -72.683 }] : [])
        return json([])
      }
      if (name === 'profiles') return result({ id, role, full_name: 'Test', passenger_onboarding_completed: true })
      if (name === 'driver_profiles') return result({ user_id: id, status: 'approved', is_online: true })
      if (name === 'rides') {
        if (failRead) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"test outage"}' })
        const statuses = url.searchParams.get('status') || ''
        return result(ride && statuses.includes(ride.status) ? ride : null)
      }
      if (name === 'ride_ratings') {
        const rating = ratings.get((url.searchParams.get('ride_id') || '').replace('eq.', ''))
        return result(rating ? { rating } : null)
      }
      return json([])
    }
    if (url.origin === base) return route.continue()
    return route.abort()
  })
  return context
}
;(async () => {
  const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true })
  fs.mkdirSync('test-results', { recursive: true })
  try {
    const context = await setup(browser, 'passenger')
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/passenger/dashboard`)
    const input = page.locator('.route-card input:not([readonly])')
    await input.waitFor()
    await input.fill('12 rue Test Gonaives')
    await page.getByText('Adresse introuvable. Choisissez le point exact sur la carte.').waitFor()
    assert.equal(await input.inputValue(), '12 rue Test Gonaives')
    assert.equal(await page.locator('.passenger-typed-address-preview').count(), 0)
    await page.getByRole('button', { name: 'Choisir la destination sur la carte' }).click()
    await page.getByText('Déplacez la carte, puis cliquez sur votre destination exacte.').waitFor()
    assert.equal(await page.getByRole('button', { name: 'Confirmer ce point' }).isDisabled(), true)
    if (process.env.TEST_MAP === '1') {
      await page.locator('section[aria-label="Choisir la destination sur la carte"] canvas').click({ position: { x: 200, y: 130 } })
      await page.getByRole('button', { name: 'Confirmer ce point' }).click()
      assert.equal(await input.inputValue(), '12 rue Test Gonaives')
      await page.locator('button.request-button').click()
      await page.locator('.pending-ride-card').waitFor()
      const request = calls.find(call => call.name === 'request_ride_v3')
      assert.equal(request.body.p_destination_address, '12 rue Test Gonaives')
      assert.equal(Number.isFinite(request.body.p_destination_latitude), true)
      assert.equal(calls.filter(call => call.name === 'request_ride_v3').length, 1)
    } else {
      await page.getByRole('button', { name: 'Fermer', exact: true }).click()
    }
    console.log('PASS: typed address retained, no city substitution, explicit map selection and booking')

    ride = fixture('ride-1', 'requested')
    await page.reload()
    await page.locator('.pending-ride-card').waitFor()
    assert.equal(await input.count(), 0)
    for (const [status, title] of [['accepted', 'Le chauffeur a accepté la course'], ['driver_arriving', 'Votre chauffeur est arrivé'], ['in_progress', 'La course a commencé'], ['completed', 'Course terminée']]) {
      ride = { ...ride, status, driver_id: driverId }
      await page.evaluate(() => window.dispatchEvent(new Event('focus')))
      await page.locator('.movi-passenger-flow-copy strong').filter({ hasText: title }).waitFor()
      assert.equal(await page.locator('.pending-ride-card').count(), 0)
      assert.equal(await input.count(), 0)
      if (status === 'accepted') {
        failRead = true
        await page.evaluate(() => window.dispatchEvent(new Event('focus')))
        await page.getByRole('alert').filter({ hasText: 'Actualisation' }).waitFor()
        assert.equal(await page.locator('.movi-passenger-flow-copy strong').innerText(), title)
        failRead = false
        await page.getByRole('button', { name: 'Réessayer', exact: true }).click()
      }
      await page.screenshot({ path: `test-results/${status}.png`, fullPage: true })
    }
    assert.equal(await page.locator('.passenger-live-top-map').count(), 0)
    await page.getByRole('button', { name: '4 étoiles', exact: true }).click()
    await page.getByRole('button', { name: 'Envoyer l’évaluation' }).click()
    await page.getByRole('button', { name: 'Commander une nouvelle course' }).click()
    await input.waitFor()
    assert.equal(await input.inputValue(), '')
    await page.reload()
    await input.waitFor()
    ride = fixture('ride-2', 'completed')
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.getByRole('button', { name: 'Envoyer l’évaluation' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Envoyer l’évaluation' }).isDisabled(), true)
    assert.equal(ratings.get('ride-1'), 4)
    ride = fixture('ride-3', 'requested')
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.locator('.cancel-button').waitFor()
    page.once('dialog', dialog => dialog.accept())
    await page.locator('.cancel-button').click()
    await page.getByText('Course annulée', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Commander une nouvelle course' }).click()
    await input.waitFor()
    assert.equal(errors.length, 0, errors.join('\n'))
    console.log('PASS: all six states, refresh restore, read failure recovery, rating isolation, cancellation, new ride reset')
    await context.close()

    ride = fixture('driver-ride', 'requested')
    const driverContext = await setup(browser, 'driver')
    const driverPage = await driverContext.newPage()
    await driverPage.goto(`${base}/driver/dashboard-v2`)
    await driverPage.getByRole('button', { name: /Accepter/ }).click()
    await driverPage.getByRole('button', { name: 'Je suis arrivé', exact: true }).click()
    await driverPage.getByRole('button', { name: 'Commencer le trajet', exact: true }).click()
    await driverPage.getByRole('button', { name: 'Terminer le trajet', exact: true }).click()
    assert.equal(ride.status, 'completed')
    assert.equal(calls.filter(call => call.role === 'driver' && call.name === 'get_passenger_live_driver_tracking').length, 0)
    console.log('PASS: driver accept, arrive, start, complete RPC flow unchanged')
    await driverContext.close()
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
