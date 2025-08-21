// Simple example

import { logSettings, P2pProvider, withP2pProvider } from '../src/index.ts'

const URL = 'http://70.34.217.65:4020/'
// const URL = 'http://127.0.0.1:4001/'
const CHAIN_ID = 1

logSettings.level = 'debug'

async function example_1_1() {
  const p2pp = await P2pProvider.new(URL, CHAIN_ID)

  console.log('p2pp created')

  setInterval(() => {
    p2pp.getBlockNumber().then((b) => console.log('blocknumber: ', b))
  }, 7000)
}

async function doSomthing(p2pp: P2pProvider) {
  const b = await p2pp.getBlockNumber()
  console.log('blocknumber: ', b)
}

async function example_1_2() {
  const p2pp = await P2pProvider.new(URL, CHAIN_ID)
  await doSomthing(p2pp)
}

async function example_1_3() {
  const p2pp = await P2pProvider.new(URL, CHAIN_ID)
  await doSomthing(p2pp)
  // with teardown, the url fetch interval would get stop
  // otherwise it continues working until the program get close
  p2pp.teardown()
}

async function example_1_4() {
  // it automatically teardown at the end
  await withP2pProvider(URL, CHAIN_ID, doSomthing)
}

example_1_1()
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
