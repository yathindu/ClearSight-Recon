import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ENV_KEYS = ['FAL_KEY', 'FAL_API_KEY']

/**
 * Parse a .env file without exposing values to the client.
 * @param {string} filePath
 */
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}

  const content = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const result = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue

    const name = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[name] = value
  }

  return result
}

function pickKey(sources) {
  for (const source of sources) {
    for (const name of ENV_KEYS) {
      const value = source[name]
      if (value && String(value).trim()) {
        return String(value).trim().replace(/^["']|["']$/g, '')
      }
    }
  }
  return ''
}

/**
 * Reads FAL_KEY for the server proxy (never exposed to the browser).
 */
export function getFalKey() {
  const cwd = process.cwd()
  const mode =
    process.env.NODE_ENV === 'production' ? 'production' : 'development'

  const envFile = parseEnvFile(resolve(cwd, '.env'))
  const envLocal = parseEnvFile(resolve(cwd, '.env.local'))
  const envMode = parseEnvFile(resolve(cwd, `.env.${mode}`))
  const envModeLocal = parseEnvFile(resolve(cwd, `.env.${mode}.local`))

  return pickKey([process.env, envModeLocal, envMode, envLocal, envFile])
}

export function isFalKeyConfigured() {
  return getFalKey().length > 0
}
