import {
  AbstractProvider,
  ethers,
  FallbackProvider,
  FetchGetUrlFunc,
  FetchRequest,
  Network,
  PerformActionRequest,
} from 'ethers'
import {
  ChainID,
  mkP2pProviderState,
  P2pProviderState,
  settings as coreSettings,
  teardownP2ppsUpdater,
  Url,
  mkFullUrl,
  Second,
  UPDATE_INTERVAL_MAIN,
  mkRank,
} from './core'

///////////////////////////////////////////////////////////////////////////////

export class P2pProvider extends AbstractProvider {
  #state: P2pProviderState<FallbackProvider>

  private constructor(p2pps: P2pProviderState<FallbackProvider>) {
    super()
    this.#state = p2pps
  }

  static async new(
    url: Url,
    chainId: ChainID,
    updateInterval: Second = UPDATE_INTERVAL_MAIN
  ): Promise<P2pProvider> {
    const rank = mkRank({
      sampleCount: 10,
      latencyWeight: 0.3,
      stabilityWeight: 0.7,
      ping: (t: ethers.JsonRpcProvider) => t.send('net_listening', []),
    })

    const mkFallback = async (newUrls: Url[]) => {
      const p = newUrls.map(
        (url) => new ethers.JsonRpcProvider(mkFullUrl(url, chainId))
      )

      // TODO: consider same ranks (to use weight and setting the same priority)
      const ranked = (await rank(p)).map((p, idx) => ({
        provider: p,
        priority: idx + 1,
        weight: 1,
      }))

      return new ethers.FallbackProvider(ranked)
    }

    const mutFn = (x: FallbackProvider, newX: FallbackProvider) => (x = newX)

    return new P2pProvider(
      await mkP2pProviderState(url, mkFallback, mutFn, updateInterval)
    )
  }

  teardown() {
    teardownP2ppsUpdater(this.#state)
  }

  ///////////////////////////
  // AbstractProvider methods

  async _detectNetwork(): Promise<Network> {
    return this.#state.inner._detectNetwork()
  }

  async _perform<T = any>(req: PerformActionRequest): Promise<T> {
    return this.#state.inner._perform(req)
  }
}

export async function withP2pProvider(
  url: Url,
  chainId: number,
  f: (p: P2pProvider) => Promise<void>,
  updateInterval: Second = UPDATE_INTERVAL_MAIN
) {
  const p2pp = await P2pProvider.new(url, chainId, updateInterval)
  await f(p2pp)
  p2pp.teardown()
}

export function registerFetchFn(f: FetchGetUrlFunc) {
  FetchRequest.registerGetUrl(f)
  coreSettings.fetch = f
}
