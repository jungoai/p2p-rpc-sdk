// Simple example

import { UPDATE_INTERVAL_TEST } from '../src/core.ts'
import { logSettings, P2pProvider, withP2pProvider } from '../src/index.ts'

const URL = 'http://70.34.217.65:4020/'
// const URL = 'http://127.0.0.1:4001/'
const CHAIN_ID = 1

logSettings.level = 'debug'

async function example_1() {
  // UPDATE_INTERVAL_TEST is optional for testing p2p-network. You can ommit it to be match to p2p-network main.
  // And you can also pass arbitrary value in second as fetching URLs interval
  const p2pp = await P2pProvider.new(URL, CHAIN_ID, UPDATE_INTERVAL_TEST)

  console.log('p2pp created')

  setInterval(() => {
    p2pp.getBlockNumber().then((b) => console.log('blocknumber: ', b))
  }, 7000)
}

const mkP2pp = P2pProvider.new(URL, CHAIN_ID, UPDATE_INTERVAL_TEST)

async function doSomthing(p2pp: P2pProvider) {
  const b = await p2pp.getBlockNumber()
  console.log('blocknumber: ', b)
}

async function example_2() {
  const p2pp = await mkP2pp
  await doSomthing(p2pp)
}

async function example_3() {
  const p2pp = await mkP2pp
  await doSomthing(p2pp)
  // with teardown, the url fetch interval will stop
  // otherwise it continues working until the program closed
  p2pp.teardown()
}

async function example_4() {
  // it automatically teardown at the end
  await withP2pProvider(URL, CHAIN_ID, doSomthing, UPDATE_INTERVAL_TEST)
}

example_1()
// example_1_2()
// example_1_3()
// example_1_4()

///////////////////////////////////////////////////////////////////////////////
// vanilla ethers

import { ethers } from 'ethers'

async function ethersShowcase() {
  const p = new ethers.JsonRpcProvider(`${URL}/${CHAIN_ID}`)

  const b = await p.getBlockNumber()
  console.log('blocknumber: ', b)
}

// ethersShowcase()
