import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const storageKey = 'taxi-auth-default'
const fastStorageKey = 'movi-session'

function extractSession(raw: string | null) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const session = parsed?.currentSession ?? parsed?.session ?? parsed
    if (!session?.access_token || !session?.user?.id) return null
    return session
  } catch {
    return null
  }
}

function writeFastSession(session: any | null) {
  if (typeof window === 'undefined') return
  try {
    if (session?.access_token && session?.user?.id) {
      window.localStorage.setItem(fastStorageKey, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(fastStorageKey)
    }
  } catch {
    // Fast session persistence must never block MOVI.
  }
}

function migrateLegacySession() {
  if (typeof window === 'undefined') return
  try {
    const fast = extractSession(window.localStorage.getItem(fastStorageKey))
    if (fast) return

    const current = extractSession(window.localStorage.getItem(storageKey))
    if (current) {
      writeFastSession(current)
      return
    }

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key || key === storageKey || key === fastStorageKey) continue
      if (!key.includes('auth') && !key.includes('supabase') && !key.includes('sb-')) continue

      const raw = window.localStorage.getItem(key)
      const session = extractSession(raw)
      if (!session) continue

      window.localStorage.setItem(storageKey, JSON.stringify(session))
      writeFastSession(session)
      break
    }
  } catch {
    // Storage migration must never block MOVI.
  }
}

migrateLegacySession()

const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)
  const upstreamSignal = init.signal

  const abortFromUpstream = () => controller.abort()
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort()
    else upstreamSignal.addEventListener('abort', abortFromUpstream, { once: true })
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted) {
      return new Response(
        JSON.stringify({ message: 'Request timed out. Please try again.' }),
        {
          status: 504,
          statusText: 'Gateway Timeout',
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
    upstreamSignal?.removeEventListener('abort', abortFromUpstream)
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey,
  },
  global: {
    fetch: fetchWithTimeout,
  },
})

function readPersistedSession() {
  if (typeof window === 'undefined') return null
  try {
    migrateLegacySession()
    return extractSession(window.localStorage.getItem(fastStorageKey))
      ?? extractSession(window.localStorage.getItem(storageKey))
  } catch {
    return null
  }
}

// Keep one simple copy of the live Supabase session for Safari/PWA. This avoids
// waiting on the internal auth lock when MOVI already has a valid session.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    writeFastSession(session)
  })
}

const originalGetSession = supabase.auth.getSession.bind(supabase.auth)
supabase.auth.getSession = (async () => {
  const persisted = readPersistedSession()
  if (persisted) {
    return { data: { session: persisted }, error: null }
  }

  const result = await originalGetSession()
  if (result.data.session) writeFastSession(result.data.session)
  return result
}) as typeof supabase.auth.getSession

const originalGetUser = supabase.auth.getUser.bind(supabase.auth)
supabase.auth.getUser = (async (...args: Parameters<typeof originalGetUser>) => {
  const before = await supabase.auth.getSession()
  if (before.data.session?.user) {
    return { data: { user: before.data.session.user }, error: null }
  }

  const result = await originalGetUser(...args)
  if (result.data.user) return result

  const after = await supabase.auth.getSession()
  if (after.data.session?.user) {
    return { data: { user: after.data.session.user }, error: null }
  }

  return result
}) as typeof supabase.auth.getUser
