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
  assert.equal(missing.results[0].featureType, 'place', 'A city match must stay labeled as a city')
  assert.equal(missing.precise, false)
  featureType = 'neighborhood'
  assert.equal((await search('12 rue Introuvable Gonaives')).precise, false)
  featureType = 'street'
  const street = await search('12 rue Test Gonaives')
  assert.equal(street.results[0].label, 'Rue Test, Les Gonaïves, Haïti', 'Show the actual matched address rather than fabricating a label')
  assert.equal(street.precise, false)
  for (const query of ['21 rue Lamarre Petion ville', '70 rue Petion port au prince']) {
    const result = await search(query)
    assert.equal(result.results.length, 1)
    assert.equal(result.results[0].featureType, 'place')
    assert.equal(result.precise, false)
    assert.ok(!result.results[0].label.includes('Gonaïves'), 'Reject a provider result from the wrong city')
  }
  const providerQueries = []
  global.fetch = async url => {
    providerQueries.push(new URL(url).searchParams.get('q'))
    if (String(url).includes('nominatim')) return Response.json([])
    return Response.json({ features: ['Pétion-Ville, Ouest, Haïti', "Saut-d’Eau, Centre, Haïti"].map((label, i) => ({
      id: String(i), geometry: { coordinates: [-72.28, 18.51 + i] },
      properties: { feature_type: 'place', full_address: label }
    })) })
  }
  const typo = await search('70 rue lamarre petioin ville')
  assert.deepEqual(typo.results.map(result => result.label), ['Pétion-Ville, Ouest, Haïti'])
  assert.equal(typo.precise, false, 'A city suggestion is not an exact street address')
  assert.ok(providerQueries.every(query => !query.includes('petioin')), 'Providers receive the corrected city spelling')
  console.log('PASS: city filtering, city typo, approximate results, real street label')
})().finally(() => { global.fetch = originalFetch }).catch(error => { console.error(error); process.exitCode = 1 })
