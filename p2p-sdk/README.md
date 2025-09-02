## Run Example

```bash
npm run example:1
npm run example:2
```

### Set debug log

```bash
LOG_LEVEL="debug" npm run example:2
```

## Example

Install:
```bash
npm install @mohsennz/p2p-sdk
```

```typescript
import { P2pProvider } from '@mohsennz/p2p-sdk'

const url = 'https://evm-rpcs.jungoai.xyz/'
const chainId = 30
const p2pp = await P2pProvider.new(url, chainId)

const blocknumber = await p2pp.getBlockNumber()
console.log('blocknumber: ', blocknumber)
```

Wagmi example:
```typescript
import { baseAccount, injected, walletConnect } from '@wagmi/connectors'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { P2pWagmiTransports } from '@mohsennz/p2p-sdk'

const url = 'https://evm-rpcs.jungoai.xyz/'
const chainId = 30

const p2pTrans = await P2pWagmiTransports.new(URL, [mainnet.id, sepolia.id])

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    baseAccount(),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: p2pTrans.transports().get(mainnet.id),
    [sepolia.id]: p2pTrans.transports().get(sepolia.id),
  },
})
```

For more inforemation see `./examples/` directory.
