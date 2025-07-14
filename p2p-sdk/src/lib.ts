import {
  AbstractProvider,
  ethers,
  FallbackProvider,
  FetchGetUrlFunc,
  FetchRequest,
  Network,
  PerformActionRequest,
} from 'ethers'
import { Logger, TLogLevelName } from 'tslog'

export * from 'ethers'

function isLogLevel(s: string): boolean {
  return ['silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(
    s
  )
}

function logLevelFromStr(s: string): TLogLevelName | null {
  if (isLogLevel(s)) return s as TLogLevelName
  else return null
}

const logLvlEnv = process.env.LOG_LEVEL
const logLevel = logLvlEnv ? logLevelFromStr(logLvlEnv) || 'info' : 'info'

export const log = new Logger({
  displayDateTime: false, // NOTE: true in prod, false in dev
  displayFilePath: 'hidden',
  minLevel: logLevel,
})

type Second = number
type Url = string

// prettier-ignore
type P2pProviderState = {
  chainId:          number
  urls:             Url[]
  fallbackProvider: FallbackProvider
  // NOTE: make sure time interval is relevant to p2p nodes ping interval, Default: 5 second
  updateInterval:   Second
}

// TODO: at first check ping of each url, remove failed urls
async function mkP2pProviderState(
  url: Url,
  chainId: number
): Promise<P2pProviderState> {
  const urls = await listProviderUrls(url)
  urls.sort() // NOTE: we always store sorted urls for later comparison

  log.debug('all urls:', urls)

  const providers = urls.map((u) => mkJsonRpcProvider(u, chainId))
  // .map((p) => ({ provider: p, weight: 1, priority: 1 })) // TODO: consider it

  const updateInterval: Second = 5

  const p2pps: P2pProviderState = {
    chainId,
    urls,
    fallbackProvider: new ethers.FallbackProvider(providers),
    updateInterval,
  }

  setInterval(() => updateFallback(p2pps), updateInterval * 1000)

  return p2pps
}

async function updateFallback(p2pp: P2pProviderState) {
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

let fetch_ = defFetch

export function registerFetchFn(f: FetchGetUrlFunc) {
  FetchRequest.registerGetUrl(f)
  fetch_ = f
}

export async function listProviderUrls(url: Url): Promise<Url[]> {
  log.debug('fetching urls')

  const { statusCode, body } = await fetch_(new FetchRequest(url))

  if (statusCode !== 200) throw new Error(`HTTP error! status: ${statusCode}`)

  if (body === null) throw new Error(`Body is not a valid JSON: ${body}`)

  const textDecoder = new TextDecoder('utf-8')
  const bodyString = textDecoder.decode(body)

  try {
    const jsonBody = JSON.parse(bodyString)

    log.debug('data fetched with:', jsonBody)
    const otherUrls = Object.keys(jsonBody)

    return [url, ...otherUrls]
  } catch (jsonError) {
    throw new Error(
      `Could not parse response body as JSON (it might not be JSON): ${jsonError}`
    )
  }
}

///////////////////////////////////////////////////////////////////////////////
// AbstractProvider

export class P2pProvider extends AbstractProvider {
  #state: P2pProviderState

  private constructor(p2pps: P2pProviderState) {
    super()
    this.#state = p2pps
  }

  static async new(url: Url, chainId: number): Promise<P2pProvider> {
    return new P2pProvider(await mkP2pProviderState(url, chainId))
  }

  async _detectNetwork(): Promise<Network> {
    return this.#state.fallbackProvider._detectNetwork()
  }

  async _perform<T = any>(req: PerformActionRequest): Promise<T> {
    return this.#state.fallbackProvider._perform(req)
  }
}
