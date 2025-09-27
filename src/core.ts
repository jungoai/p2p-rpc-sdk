// TODO: make it independent from ethers
import { FetchGetUrlFunc, FetchRequest } from 'ethers'
import { concatPath, debug, info } from './utile'

export type Second = number
export type Url = string
export type ChainID = number

export const UPDATE_INTERVAL_TEST = 5
export const UPDATE_INTERVAL_MAIN = 30

// prettier-ignore
export type P2pProviderState<T> = {
  inner:            T       // generated type from @urls to be used in app
  urls:             Url[]   // urls are without chain-id
  updateInterval:   Second  // NOTE: make sure time interval is relevant to
                            // p2p nodes ping interval 5 in test, 30 in production, 
                            // Default: 5 second
  intervalId:       ReturnType<typeof setInterval> | null
  mutInner:         (inner: T, newInner: T) => void, 
}

// TODO: at first check ping of each url, remove failed urls
export async function mkP2pProviderState<T>(
  url: Url,
  mkInner: (newUrls: Url[]) => Promise<T>,
  mutInner: (inner: T, newInner: T) => void,
  updateInterval: Second = UPDATE_INTERVAL_MAIN
): Promise<P2pProviderState<T>> {
  const urls = await listProviderUrls(url)

  debug('all urls:', urls)

  const pps: P2pProviderState<T> = {
    inner: await mkInner(urls),
    urls,
    updateInterval,
    intervalId: null,
    mutInner,
  }

  const id = setInterval(
    () => updateFallback(pps, mkInner),
    updateInterval * 1000
  )

  pps.intervalId = id

  return pps
}

export function teardownP2ppsUpdater(pps: P2pProviderState<any>) {
  const i = pps.intervalId
  if (i !== null) clearInterval(i)
  pps.intervalId = null
}

async function updateFallback<T>(
  pps: P2pProviderState<T>,
  mkInner: (newUrls: Url[]) => Promise<T>
) {
  debug('Checking for updating Fallback')
  for (const url of pps.urls) {
    try {
      const newUrls = await listProviderUrls(url)
      debug('Updating Fallback')
      debug('newUrls: ', newUrls)
      pps.urls = newUrls
      const newInner = await mkInner(newUrls)
      pps.mutInner(pps.inner, newInner)
      debug('Fallback updated')
      return
    } catch {
      debug(`failed to fetch from ${url}, trying next url.`)
    }
  }
  info('updateFallback: fetch from all urls failed')
}

// TODO: independent from FetchGetUrlFunc that's a ethers type
const defFetch: FetchGetUrlFunc = async (req) => {
  const res = await fetch(req.url)
  const arrayBuffer = await res.arrayBuffer()
  const body = new Uint8Array(arrayBuffer)
  return {
    statusCode: res.status,
    statusMessage: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    body: body,
  }
}

export const settings = { fetch: defFetch }

export async function listProviderUrls(url: Url): Promise<Url[]> {
  info(`fetching urls from ${url}`)

  // TODO: make it independent from FetchRequest
  const { statusCode, body } = await settings.fetch(new FetchRequest(url))

  if (statusCode !== 200) throw new Error(`HTTP error! status: ${statusCode}`)

  if (body === null) throw new Error(`Body is not a valid JSON: ${body}`)

  const textDecoder = new TextDecoder('utf-8')
  const bodyString = textDecoder.decode(body)

  try {
    const jsonBody = JSON.parse(bodyString)

    info('data fetched successfully: ', jsonBody)
    const otherUrls = Object.keys(jsonBody)

    return [url, ...otherUrls]
  } catch (jsonError) {
    throw new Error(
      `Could not parse response body as JSON (it might not be JSON): ${jsonError}`
    )
  }
}

export function mkFullUrl(url: Url, chainId: ChainID): Url {
  return concatPath(url, chainId.toString())
}
