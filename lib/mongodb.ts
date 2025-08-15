import { MongoClient, MongoClientOptions, Db } from 'mongodb'

// Use environment variables
const DEFAULT_DB = process.env.MONGODB_DB || 'cafeteria'
const uri = (process.env.MONGODB_URI || '').trim()

const disableTls = /^(1|true)$/i.test(process.env.MONGODB_DISABLE_TLS || '')
const insecureTls = /^(1|true)$/i.test(process.env.MONGODB_TLS_INSECURE || '')

if (!uri) {
  console.warn('[mongodb] Missing MONGODB_URI environment variable. Master admin only operations will work, DB-backed features will fail.')
}

// Base options
const baseOptions: MongoClientOptions = {
  retryWrites: true,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 10,
  minPoolSize: 0,
  appName: 'voteria-app'
}

// Apply TLS options conditionally (don't force TLS blindly)
if (!disableTls && insecureTls) {
  (baseOptions as any).tls = true
  ;(baseOptions as any).tlsAllowInvalidCertificates = true
  ;(baseOptions as any).tlsAllowInvalidHostnames = true
  ;(baseOptions as any).tlsInsecure = true
}

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient>
let lastFailureTime: number | null = null
const FAILURE_COOLDOWN_MS = 60_000 // 1 minute cooldown after failure
let lastLoggedUnavailable: number | null = null

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

async function tryConnect(options: MongoClientOptions) {
  const c = new MongoClient(uri, options)
  await c.connect()
  return c
}

async function createClient(): Promise<MongoClient> {
  if (!uri) throw new Error('No MongoDB URI configured')
  if (lastFailureTime && Date.now() - lastFailureTime < FAILURE_COOLDOWN_MS) {
    throw new Error('Previous MongoDB connection failure – in cooldown')
  }

  try {
    return await tryConnect(baseOptions)
  } catch (err: any) {
    const msg = err?.message || ''
    const isSsl = /SSL routines|tlsv1 alert internal error|handshake/i.test(msg)
    if (isSsl && !disableTls) {
      console.warn('[mongodb] TLS bağlantı hatası, TLS kapatılarak tekrar deneniyor (geçici). Kalıcı yapmak için .env dosyasında MONGODB_DISABLE_TLS=1 ekleyin.')
      try {
        const noTlsOpts: MongoClientOptions = { ...baseOptions }
        delete (noTlsOpts as any).tls
        delete (noTlsOpts as any).tlsAllowInvalidCertificates
        delete (noTlsOpts as any).tlsAllowInvalidHostnames
        delete (noTlsOpts as any).tlsInsecure
        ;(noTlsOpts as any).tls = false
        return await tryConnect(noTlsOpts)
      } catch (err2: any) {
        lastFailureTime = Date.now()
        console.error('[mongodb] retry (no TLS) failed:', err2?.message)
        throw err2
      }
    }
    lastFailureTime = Date.now()
    console.error('[mongodb] connect error:', {
      message: err?.message,
      stack: err?.stack,
      code: err?.code
    })
    throw err
  }
}

if (!global._mongoClientPromise) {
  global._mongoClientPromise = createClient().catch(err => {
    console.error('[mongodb] Initial connection failed:', err?.message)
    throw err
  })
}

clientPromise = global._mongoClientPromise

export async function getDb() {
  const cli = await clientPromise
  return cli.db(DEFAULT_DB)
}

export async function tryGetDb(): Promise<Db | null> {
  try {
    return await getDb()
  } catch (e:any) {
    const now = Date.now()
    if (!lastLoggedUnavailable || now - lastLoggedUnavailable > 10_000) {
      console.warn('[mongodb] DB unavailable (graceful degrade):', e?.message)
      lastLoggedUnavailable = now
    }
    return null
  }
}

export default clientPromise
