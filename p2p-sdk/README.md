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
