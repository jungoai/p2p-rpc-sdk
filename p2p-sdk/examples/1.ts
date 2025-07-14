// Simple example

import { log, P2pProvider } from '../src/lib.js'

async function runExample() {
  log.settings.minLevel = 'debug'
  const url = 'http://192.168.56.53:8002'
  const p2pp = await P2pProvider.new(url, 1)

  console.log('p2pp created')

  setInterval(() => {
    p2pp.getBlockNumber().then((b) => console.log('blocknumber: ', b))
  }, 7000)
}

runExample()
