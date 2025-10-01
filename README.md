# P2P-RPC SDK

The p2prpc SDK is a JS/TS library for connecting to the [p2prpc](https://github.com/jungoai/p2p-rpc) network, a decentralized peer-to-peer layer for blockchain RPCs.

Instead of relying on a single RPC endpoint, the SDK maintains an updated list of peer nodes and automatically handles failover, load balancing, and request retries.

With just a few lines of code, your application can send blockchain requests through a fault-tolerant RPC network.

## ✨ Features

- **Automatic Peer Discovery**
  Fetches and updates a list of available RPC nodes from the p2prpc network.

- **Fault-Tolerant RPC Calls**
  Automatically retries with another node if one becomes unavailable.

- **Blockchain Agnostic**
  Works with any evm-compatible blockchain exposing a JSON-RPC API (Ethereum, Polygon, etc.).

- **Simple API**
  Drop-in replacement for network layer of traditional RPC client libraries like ethers and wagmi.

- **Lightweight & Efficient**
  Built for speed, minimal overhead, and easy integration.

## 📦 Installation

```bash
npm install p2p-rpc-sdk
```

## 🚀 Quick Start

### Ethers

To use it in an ethers project you just need to change the line:

```diff
- const provider = new ethers.JsonRpcProvider(url)
+ const provider = await P2pProvider.new(URL, CHAIN_ID)
```

After that all API is the same of ethers.

```typescript
import { P2pProvider } from 'p2p-rpc-sdk'

const URL = 'https://evm-rpcs.jungoai.xyz/'
const CHAIN_ID = 30

async function main() {
  // Initialize client
  const provider = await P2pProvider.new(URL, CHAIN_ID) // <- new ethers.JsonRpcProvider(url)

  // Make an Ethereum JSON-RPC request
  const blocknumber = await provider.getBlockNumber()

  console.log('blocknumber: ', blocknumber)
}

main();
```

### Wagmi

To use it in a Wagmi project you need to initialize like it:

```typescript
import { baseAccount, injected, walletConnect } from '@wagmi/connectors'
import { mainnet, sepolia } from '@wagmi/core/chains'
import { P2pWagmiTransports } from 'p2p-rpc-sdk'

const URL = 'https://evm-rpcs.jungoai.xyz/'

const p2pWagmi = await P2pWagmi.new(URL, [mainnet])

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    baseAccount(),
    walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: p2pWagmi.transports().get(mainnet.id), // <- http()
    [sepolia.id]: p2pWagmi.transports().get(sepolia.id), // <- http()
  },
})
```

The lines have changed:
```diff
- [mainnet.id]: http(),
- [sepolia.id]: http(),
+ [mainnet.id]: p2pWagmi.transports().get(mainnet.id),
+ [sepolia.id]: p2pWagmi.transports().get(sepolia.id),
```


For more information checkout [examples](https://github.com/jungoai/p2p-rpc-sdk/tree/main/examples) directory.

## ⚙️ How It Works

1. **Bootstrap** – The client connects to the p2prpc network and fetches available node addresses.
2. **Address Sync** – The client keeps its address list updated automatically.
3. **Request Handling** – When making a blockchain call:
    - The SDK selects an best available node base of latency and stability.
    - If the node fails, it retries with another one.
    - Requests complete seamlessly without developer intervention.

## 🔮 Roadmap

- [x] Fault Tolerance
- [x] Drop-in replacement to favorites library like Wagmi and Ethers
- [ ] Node selection strategies base on:
  - [x] latency
  - [x] stability
  - [ ] region
  - [ ] capacity
- [ ] SDK bindings for Python, Rust, and Go.
