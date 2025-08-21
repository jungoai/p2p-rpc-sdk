// TODO: make it independent from ethers
import { FetchGetUrlFunc, FetchRequest } from 'ethers'
import { concatPath, debug, info } from './utile'

type Second = number
export type Url = string
export type ChainID = number

// prettier-ignore
export type P2pProviderState<T> = {
  urls:             Urls    // urls are without chain-id
  // TODO: rename
  fallbackProvider: T       // generated type from @urls to be used in app
  updateInterval:   Second  // NOTE: make sure time interval is relevant to
                            // p2p nodes ping interval 5 in test, 30 in production, 
                            // Default: 5 second
  intervalId:       ReturnType<typeof setInterval> | null
}

export class Urls {
  private _inner: Url[]

  constructor(urls: Url[]) {
    urls.sort() // NOTE: we always store sorted urls for later comparison to new urls
    this._inner = urls
  }

  get inner(): Url[] {
    return this._inner
  }

  haveDiffWith(rhs: Urls): boolean {
    return (
      this._inner.length !== rhs.inner.length ||
      this._inner.some((val, i) => val !== rhs.inner[i])
    )
  }
}

// TODO: at first check ping of each url, remove failed urls
export async function mkP2pProviderState<T>(
  url: Url,
  mkFallback: (newUrls: Urls) => T
): Promise<P2pProviderState<T>> {
  const urls = new Urls(await listProviderUrls(url))

  debug('all urls:', urls.inner)

  // TODO: get from user
  const updateInterval: Second = 5

  const p2pps: P2pProviderState<T> = {
    urls,
    fallbackProvider: mkFallback(urls),
    updateInterval,
    intervalId: null,
  }

  const id = setInterval(
    () => updateFallback(p2pps, mkFallback),
    updateInterval * 1000
  )

  p2pps.intervalId = id

  return p2pps
}

export function teardownP2ppsUpdater(p2pps: P2pProviderState<any>) {
  const i = p2pps.intervalId
  if (i !== null) clearInterval(i)
  p2pps.intervalId = null
}

async function updateFallback<T>(
  p2pp: P2pProviderState<T>,
  mkFallback: (newUrls: Urls) => T
) {
  debug('Checking for updating Fallback')
  for (const url of p2pp.urls.inner) {
    try {
      const newUrls = new Urls(await listProviderUrls(url))

      if (newUrls.haveDiffWith(p2pp.urls)) {
        debug('Updating Fallback')
        debug('newUrls: ', newUrls.inner)
        p2pp.urls = newUrls
        p2pp.fallbackProvider = mkFallback(newUrls)

        debug('Fallback updated')
      }
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

export function urlWithChainId(url: Url, chainId: ChainID): Url {
  return concatPath(url, chainId.toString())
}
