// Example with using proxy

import { FetchGetUrlFunc } from 'ethers'
import { logSettings, P2pProvider, registerFetchFn } from '../src/index.ts'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { UPDATE_INTERVAL_TEST } from '../src/core.ts'

const PROXY_URL = 'http://127.0.0.1:12334'
const agent = new HttpsProxyAgent(PROXY_URL)

const customFetchWithProxy: FetchGetUrlFunc = async (req) => {
  const url = new URL(req.url)
  const options = {
    method: req.method,
    headers: req.headers,
    body: req.body,
    agent: agent,
    timeout: req.timeout,
  }

  const response = await fetch(url, options)

  const arrayBuffer = await response.arrayBuffer()
  const body = new Uint8Array(arrayBuffer)

  return {
    body: body,
    headers: Object.fromEntries(response.headers.entries()),
    statusCode: response.status,
    statusMessage: response.statusText,
  }
}

registerFetchFn(customFetchWithProxy)

logSettings.level = 'debug'

async function example_2() {
  const url = 'https://evm-rpcs.jungoai.xyz/'
  // const url = 'http://52.14.41.79:4001'
  const p2pp = await P2pProvider.new(url, 30, UPDATE_INTERVAL_TEST)

  console.log('p2pp created')

  // const b = await p2pp().getBlockNumber()
  // console.log('blocknumber: ', b)

  setInterval(() => {
    p2pp.getBlockNumber().then((b) => console.log('blocknumber: ', b))
  }, 10000)
}

example_2()

// async function f() {
//   const p = new ethers.JsonRpcProvider('https://evm-rpcs.jungoai.xyz/1')
//   const b = await p.getBlockNumber()
//   console.log('blocknumber: ', b)
// }
//
// f()

// const urls = await fetchProviderUrls('http://192.168.56.53:8002')
// console.log('urls: ', urls)
