import { ethers } from 'ethers'
import { mkP2pProvider } from '../src/lib.js'

async function runExample() {
  const url = 'http://192.168.56.53:8002'
  const p2pp = await mkP2pProvider(url, 1)
  // const p = new ethers.JsonRpcProvider(`${url}/1`'http://192.168.56.53:8002/1')

  console.log('p2pp created')

  setInterval(() => {
    p2pp()
      .getBlockNumber()
      .then((b) => console.log('blocknumber: ', b))
  }, 7000)
}

runExample()

// const urls = await fetchProviderUrls('http://192.168.56.53:8002')
//
// console.log('urls: ', urls)
