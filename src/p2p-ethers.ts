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
    const mkFallback = async (newUrls: Url[]) => {
      const p = newUrls.map(
        (url) => new ethers.JsonRpcProvider(mkFullUrl(url, chainId))
      )
      // .map((p) => ({ provider: p, weight: 1, priority: 1 })) // TODO: consider it
      return new ethers.FallbackProvider(p)
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
