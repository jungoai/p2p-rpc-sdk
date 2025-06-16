import { ethers, FallbackProvider } from 'ethers'
import { mkP2pProvider } from '../src/lib.js'

// const RPC_URL = "https://mainnet.infura.io/v3/YOUR_PROJECT_ID";
const RPC_URL = "http://192.168.56.53:8002";
const address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Example address

const provider = new ethers.JsonRpcProvider(RPC_URL);
const p2pp = await mkP2pProvider(RPC_URL, 1)

const ITERATIONS = 20;

async function benchmark(name, fn) {
  let total = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    const duration = end - start;
    total += duration;
    console.log(`${name} [Run ${i + 1}]: ${duration.toFixed(2)}ms`);
  }

  const average = total / ITERATIONS;
  console.log(`\n>>> ${name} average over ${ITERATIONS} runs: ${average.toFixed(2)}ms\n`);
}

(async () => {
  console.log("Benchmarking ethers.js vs p2p SDK:\n");

  await benchmark("ethers.getBalance", async () => {
    await provider.getBlockNumber();
  });

  await benchmark("p2p.getBalance", async () => {
    await p2pp().getBlockNumber();
  });
})();
