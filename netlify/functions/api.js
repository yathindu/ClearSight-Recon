import { dispatchFalApi } from '../../server/falApiRouter.js'

/**
 * Netlify Function handler for all /api/* routes.
 * Adapts Netlify's event/response format to the Node-style req/res interface
 * that dispatchFalApi expects.
 *
 * netlify.toml redirects /api/* → /.netlify/functions/api, so event.path
 * already contains the original path (e.g. /api/generate-face/submit).
 */
export async function handler(event) {
  const qs = new URLSearchParams(event.queryStringParameters ?? {}).toString()
  const url = event.path + (qs ? `?${qs}` : '')

  const mockReq = {
    url,
    method: event.httpMethod,
    body: event.isBase64Encoded
      ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
      : (event.body ?? null),
  }

  const mockRes = {
    _statusCode: 200,
    _headers: {},
    _body: '',
    get statusCode() {
      return this._statusCode
    },
    set statusCode(val) {
      this._statusCode = val
    },
    setHeader(name, value) {
      this._headers[name] = value
    },
    end(body) {
      this._body = body ?? ''
    },
  }

  const handled = await dispatchFalApi(mockReq, mockRes)

  if (!handled) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Not found' }),
    }
  }

  return {
    statusCode: mockRes._statusCode,
    headers: mockRes._headers,
    body: mockRes._body,
  }
}
