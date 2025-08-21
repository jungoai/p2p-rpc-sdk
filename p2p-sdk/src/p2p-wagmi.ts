import { fallback, http, Transport } from '@wagmi/core'
import { FallbackTransport } from 'viem'
import {
  ChainID,
  mkP2pProviderState,
  P2pProviderState,
  teardownP2ppsUpdater,
  Url,
  Urls,
  urlWithChainId,
} from './core'

export class P2pWagmiTransports {
  #state: P2pProviderState<[ChainID, Transport[]][]>
  #transports: Map<ChainID, FallbackTransport<Transport[]>>

  private constructor(p2pps: P2pProviderState<[ChainID, Transport[]][]>) {
    this.#state = p2pps
    this.#transports = mkTransports(p2pps)
  }

  static async new(url: Url, chainIds: ChainID[]): Promise<P2pWagmiTransports> {
    // TODO: categorize URLs base on supporting chainId in p2prpc
    const mkFallback = (newUrls: Urls): [number, Transport[]][] =>
      chainIds.map((chainId) => [
        chainId,
        newUrls.inner.map((url) => http(urlWithChainId(url, chainId))),
      ])

    return new P2pWagmiTransports(await mkP2pProviderState(url, mkFallback))
  }

  transports(): Map<number, FallbackTransport<Transport[]>> {
    return this.#transports
  }

  teardown() {
    teardownP2ppsUpdater(this.#state)
  }
}

function mkTransports(
  p2pps: P2pProviderState<[ChainID, Transport[]][]>
): Map<ChainID, FallbackTransport<Transport[]>> {
  return new Map(
    p2pps.fallbackProvider.map(([chainId, transport]) => [
      chainId,
      fallback(transport),
    ])
  )
}
