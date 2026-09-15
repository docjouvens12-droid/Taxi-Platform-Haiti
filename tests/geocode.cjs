const assert = require('node:assert/strict')
const fs = require('node:fs')
const Module = require('node:module')
const path = require('node:path')
const { NextRequest } = require('next/server')

const filename = path.resolve('app/api/geocode/route.ts')
const compiled = Module.stripTypeScriptTypes(fs.readFileSync(filename, 'utf8'))
  .replace("import { NextRequest, NextResponse } from 'next/server'", "const { NextRequest, NextResponse } = require('next/server')")
  .replace('export async function GET', 'async function GET') + '\nexports.GET = GET'
const mod = new Module(filename, module)
mod.paths = module.paths
mod._compile(compiled, filename)
const originalFetch = global.fetch
process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = 'test-only'
let featureType = 'place'
let calls = 0
global.fetch = async url => {
  calls++
  if (String(url).includes('nominatim')) return Response.json([])
  return Response.json({ features: [{ id: 'result', geometry: { coordinates: [-72.6843, 19.4475] }, properties: { feature_type: featureType, name: featureType === 'place' ? 'Les Gonaïves' : 'Rue Test', full_address: featureType === 'place' ? 'Les Gonaïves, Artibonite, Haïti' : 'Rue Test, Les Gonaïves, Haïti' } }] })
}
async function search(q) {
  return (await mod.exports.GET(new NextRequest(`http://localhost/api/geocode?q=${encodeURIComponent(q)}`))).json()
}
;(async () => {
  const city = await search('Gonaives')
  assert.equal(city.results[0].featureType, 'place')
  assert.equal(calls, 0, 'An explicit city search still works')
  const missing = await search('12 rue Introuvable Gonaives')
  assert.deepEqual(missing.results, [], 'Do not silently use the city center for a street')
  assert.equal(missing.precise, false)
  featureType = 'neighborhood'
  assert.deepEqual((await search('12 rue Introuvable Gonaives')).results, [])
  featureType = 'street'
  const street = await search('12 rue Test Gonaives')
  assert.equal(street.results[0].label, 'Rue Test, Les Gonaïves, Haïti', 'Show the actual matched address rather than fabricating a label')
  assert.equal(street.precise, true)
  console.log('PASS: explicit city, missing street, neighborhood rejection, real street label')
})().finally(() => { global.fetch = originalFetch }).catch(error => { console.error(error); process.exitCode = 1 })
