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
    const rank = rankTransports({
      sampleCount: 10,
      timeout: 1_000,
      weights: {},
    })
    // TODO: categorize URLs base on supporting chainId in p2prpc
    const mkTransports = async (newUrls: Url[]): Promise<TransportsM> => {
      const x = await Promise.all(
        chains.map(async (c) =>
          tuple(
            c.id,
            await rank(newUrls.map((url) => http(mkFullUrl(url, c.id))))
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

// It's a manipulated version of private rankTransports in viem
export function rankTransports({
  ping,
  sampleCount = 10,
  timeout = 1_000,
  weights = {},
}: RankOptions): (transports: readonly Transport[]) => Promise<Transport[]> {
  const { stability: stabilityWeight = 0.7, latency: latencyWeight = 0.3 } =
    weights

  type SampleData = { latency: number; success: number }
  type Sample = SampleData[]
  const samples: Sample[] = []

  const rankTransports_ = async (transports: readonly Transport[]) => {
    // 1. Take a sample from each Transport.
    const sample: Sample = await Promise.all(
      transports.map(async (transport) => {
        const transport_ = transport({ retryCount: 0, timeout })

        const start = Date.now()
        let end: number
        let success: number
        try {
          await (ping
            ? ping({ transport: transport_ })
            : transport_.request({ method: 'net_listening' }))
          success = 1
        } catch {
          success = 0
        } finally {
          end = Date.now()
        }
        const latency = end - start
        return { latency, success }
      })
    )

    // 2. Store the sample. If we have more than `sampleCount` samples, remove
    // the oldest sample.
    samples.push(sample)
    if (samples.length > sampleCount) samples.shift()

    // 3. Calculate the max latency from samples.
    const maxLatency = Math.max(
      ...samples.map((sample) =>
        Math.max(...sample.map(({ latency }) => latency))
      )
    )

    // 4. Calculate the score for each Transport.
    const scores = transports
      .map((_, i) => {
        const latencies = samples.map((sample) => sample[i].latency)
        const meanLatency =
          latencies.reduce((acc, latency) => acc + latency, 0) /
          latencies.length
        const latencyScore = 1 - meanLatency / maxLatency

        const successes = samples.map((sample) => sample[i].success)
        const stabilityScore =
          successes.reduce((acc, success) => acc + success, 0) /
          successes.length

        if (stabilityScore === 0) return [0, i]
        return [
          latencyWeight * latencyScore + stabilityWeight * stabilityScore,
          i,
        ]
      })
      .sort((a, b) => b[0] - a[0])

    return scores.map(([, i]) => transports[i])
  }
  return rankTransports_
}

// It's a manipulated version of private RankOptions in viem
type RankOptions = {
  /**
   * Ping method to determine latency.
   */
  ping?: (parameters: {
    transport: ReturnType<Transport>
  }) => Promise<unknown> | undefined
  /**
   * The number of previous samples to perform ranking on.
   * @default 10
   */
  sampleCount?: number | undefined
  /**
   * Timeout when sampling transports.
   * @default 1_000
   */
  timeout?: number | undefined
  /**
   * Weights to apply to the scores. Weight values are proportional.
   */
  weights?:
    | {
        /**
         * The weight to apply to the latency score.
         * @default 0.3
         */
        latency?: number | undefined
        /**
         * The weight to apply to the stability score.
         * @default 0.7
         */
        stability?: number | undefined
      }
    | undefined
}
