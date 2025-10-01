import { fallback, http, Transport } from '@wagmi/core'
import { Chain, FallbackTransport } from 'viem'
import {
  ChainID,
  mkP2pProviderState,
  P2pProviderState,
  Second,
  teardownP2ppsUpdater,
  UPDATE_INTERVAL_MAIN,
  Url,
  mkFullUrl,
  mkRank,
} from './core'
import { replaceArray, tuple } from './utile'

///////////////////////////////////////////////////////////////////////////////

type State = P2pProviderState<TransportsM>
type TransportsM = Map<ChainID, Transport[]>

export class P2pWagmi {
  #state: State

  private constructor(s: State) {
    this.#state = s
  }

  static async new(
    url: Url,
    chains: Chain[],
    updateInterval: Second = UPDATE_INTERVAL_MAIN
  ): Promise<P2pWagmi> {
    const rank = mkRank({
      sampleCount: 10,
      latencyWeight: 0.3,
      stabilityWeight: 0.7,
      ping: (t: Transport) =>
        t({ retryCount: 0, timeout: 1_000 }).request({
          method: 'net_listening',
        }),
    })
    // TODO: categorize URLs base on supporting chainId in p2prpc
    const mkTransports = async (newUrls: Url[]): Promise<TransportsM> => {
      const x = await Promise.all(
        chains.map(async (chain) =>
          tuple(
            chain.id,
            await rank(newUrls.map((url) => http(mkFullUrl(url, chain.id))))
          )
        )
      )
      return new Map(x)
    }

    const mutFn = (t: TransportsM, newT: TransportsM) => {
      for (const [chainId, t_] of t) replaceArray(t_, newT.get(chainId) || [])
    }

    return new P2pWagmi(
      await mkP2pProviderState(url, mkTransports, mutFn, updateInterval)
    )
  }

  transports(): Map<ChainID, FallbackTransport<Transport[]>> {
    return new Map(
      Array.from(this.#state.inner).map(([cid, t]) =>
        // explicitly make rank:false to prevent inner wagmi rank function conflict to ours
        tuple(cid, fallback(t, { rank: false }))
      )
    )
  }

  teardown() {
    teardownP2ppsUpdater(this.#state)
  }
}
