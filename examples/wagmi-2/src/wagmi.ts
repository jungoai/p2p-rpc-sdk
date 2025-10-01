import { baseAccount, injected, walletConnect } from '@wagmi/connectors'
import { createConfig, http } from '@wagmi/core'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { logSettings, P2pWagmi } from '../../../src/index.ts'

// const URL = 'http://70.34.217.65:4020/'
const URL = 'https://evm-rpcs.jungoai.xyz/'
// const URL = 'http://127.0.0.1:4001/'

logSettings.level = 'debug'

const p2pWagmi = await P2pWagmi.new(URL, [mainnet])

export const config = createConfig({
  // chains: [mainnet, sepolia],
  chains: [mainnet],
  connectors: [
    injected(),
    baseAccount(),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: unOpt(p2pWagmi.transports().get(mainnet.id)),
    // [sepolia.id]: http(),
  },
})

///////////////////////////////////////////////////////////////////////////////

type Opt<T> = T | null | undefined

function unOpt<T>(x: Opt<T>): T {
  switch (x) {
    case null:
      throw new Error('unexpcted null')
    case undefined:
      throw new Error('unexpcted undefined')
    default:
      return x
  }
}
