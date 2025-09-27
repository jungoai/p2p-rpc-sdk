import { mainnet } from '@wagmi/core/chains'
import { logSettings, P2pWagmi } from '../src/index.ts'
import { createPublicClient } from 'viem'
import { UPDATE_INTERVAL_TEST } from '../src/core.ts'

logSettings.level = 'debug'

// const URL = 'http://70.34.217.65:4020/'
// const URL = 'https://evm-rpcs.jungoai.xyz/'
// const URL = 'http://127.0.0.1:4001/'
const URL = 'http://127.0.0.1:5001/'

const p2pWagmi = await P2pWagmi.new(
  URL,
  [mainnet],
  UPDATE_INTERVAL_TEST // optional, for test purpose
)

const client = createPublicClient({
  chain: mainnet,
  transport: unOpt(p2pWagmi.transports().get(mainnet.id)),
})

async function test1() {
  setInterval(() => {
    client.getBlockNumber().then((b) => console.log('blocknumber: ', b))
  }, 7000)
}

async function test2() {
  const blockNumber = await client.getBlockNumber()
  console.log('Current block:', blockNumber)

  p2pWagmi.teardown() // optional, to stop new URLs fetching
}

test1()

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
