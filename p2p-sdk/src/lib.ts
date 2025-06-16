import { ethers, FallbackProvider } from 'ethers'
import { Logger } from 'tslog'

const log = new Logger({
  displayDateTime: false, // NOTE: true in prod, false in dev
  displayFilePath: 'hidden',
})

type Second = number
type Url = string

// prettier-ignore
type P2pProvider = {
  chainId:          number
  urls:             Url[]
  fallbackProvider: FallbackProvider
  // NOTE: make sure time interval is relevant to p2p nodes ping interval, Default: 5 second
  updateInterval:   Second
}

export async function mkP2pProvider(
  url: Url,
  chainId: number
): Promise<() => FallbackProvider> {
  const p2pp = await mkP2pProvider_(url, chainId)
  log.debug('p2pProvider created')
  return () => p2pp.fallbackProvider
}

// TODO: at first check ping to each urls, remove failed urls
async function mkP2pProvider_(url: Url, chainId: number): Promise<P2pProvider> {
  const urls = await listProviderUrls(url)
  urls.sort() // NOTE: we always store sorted urls for comparison later

  log.debug('all urls:', urls)

  const providers = urls.map((u) => mkJsonRpcProvider(u, chainId))
  // .map((p) => ({ provider: p, weight: 1, priority: 1 })) // TODO

  const updateInterval: Second = 5

  const p2pp: P2pProvider = {
    chainId,
    urls,
    fallbackProvider: new ethers.FallbackProvider(providers),
    updateInterval,
  }

  setInterval(() => updateFallback(p2pp), updateInterval * 1000)

  return p2pp
}

async function updateFallback(p2pp: P2pProvider) {
  log.debug('Checking for updating Fallback')
  for (const url of p2pp.urls) {
    try {
      const newUrls = await listProviderUrls(url)
      newUrls.sort()

      // p2pp.urls should always be sorted
      if (doHaveDiff(newUrls, p2pp.urls)) {
        log.debug('Updating Fallback')
        log.debug('newUrls: ', newUrls)
        p2pp.urls = newUrls
        const p = newUrls.map((u) => mkJsonRpcProvider(u, p2pp.chainId))
        p2pp.fallbackProvider = new ethers.FallbackProvider(p)

        log.debug('Fallback updated')
      }
      return
    } catch {
      log.debug(`failed to fetch from ${url}, trying next url.`)
    }
  }
  log.info('updateFallback: fetch from all urls failed')
}

const mkJsonRpcProvider = (url: Url, chainId: number) =>
  new ethers.JsonRpcProvider(`${url}/${chainId}`)

// Check 2 url lists to have diff.
// NOTE: it assume both url lists are sorted
const doHaveDiff = (urls1: Url[], urls2: Url[]): boolean =>
  urls1.length !== urls2.length || urls1.some((val, i) => val !== urls2[i])

export async function listProviderUrls(url: Url): Promise<Url[]> {
  log.debug('feching urls')
  const res = await fetch(url)

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

  const data = await res.json()
  log.debug('data fetched with:', data)
  const otherUrls = Object.keys(data)

  return [url, ...otherUrls]
}
