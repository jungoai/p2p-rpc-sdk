import { generateKeyPair } from '@libp2p/crypto/keys'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { log } from './state.js'

const homeDir = os.homedir()
const p2pRpcDir = '.p2pRpc/'
const keysDir = p2pRpcDir + 'keys/'

const getKeyPath = (nodeName: string) => homeDir + `/${keysDir}` + nodeName

export async function addKeyFile(nodeName: string) {
  const filePath = getKeyPath(nodeName)
  try {
    // Check if file exists
    fs.accessSync(filePath, fs.constants.F_OK)
    log.info(`node ${nodeName} already exists`)
  } catch {
    await addKeyFile_(filePath)
  }
}

async function addKeyFile_(filePath: string) {
  const dir = path.dirname(filePath)
  // Ensure the directory exists
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const pk = await generateKeyPair('Ed25519')
  fs.writeFileSync(filePath, pk.raw)
  log.info(`File created at ${filePath}`)
}

export function readKeyFile(nodeName: string): Uint8Array<ArrayBufferLike> {
  const filePath = getKeyPath(nodeName)
  try {
    const b = fs.readFileSync(filePath)
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
  } catch (err) {
    log.error(`Failed to read file at ${filePath}:`, err)
    throw err
  }
}

// const pk = await generateKeyPair('Ed25519')
//
// const raw = pk.raw
//
// const x = privateKeyFromRaw(raw)
// const y = privateKeyfrom
//
// console.assert(x.equals(pk))
//
// console.log('x:', x)
