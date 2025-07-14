// Simple example

import { log, mkP2pProvider } from '../src/lib.js'

async function runExample() {
  log.settings.minLevel = 'debug'
  const url = 'http://192.168.56.53:8002'
  const p2pp = await mkP2pProvider(url, 1)

  console.log('p2pp created')

  setInterval(() => {
    p2pp()
      .getBlockNumber()
      .then((b) => console.log('blocknumber: ', b))
  }, 7000)
}

runExample()
