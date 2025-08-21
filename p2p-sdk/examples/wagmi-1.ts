import { mainnet } from '@wagmi/core/chains'
import { logSettings, P2pWagmiTransports } from '../src/index.ts'
import { createPublicClient } from 'viem'

logSettings.level = 'debug'

// const URL = 'http://70.34.217.65:4020/'
const URL = 'https://evm-rpcs.jungoai.xyz/'
// const URL = 'http://127.0.0.1:4001/'

const p2pTrans = await P2pWagmiTransports.new(URL, [mainnet.id])

const client = createPublicClient({
  chain: mainnet,
  transport: unOpt(p2pTrans.transports().get(mainnet.id)),
})

async function testNode() {
  const blockNumber = await client.getBlockNumber()
  console.log('Current block:', blockNumber)
}

testNode()

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
