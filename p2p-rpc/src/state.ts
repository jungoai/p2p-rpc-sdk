import { Logger } from 'tslog'
import * as os from 'os'
import { concatPath } from './fp.js'

export const log = new Logger({
  displayDateTime: false, // NOTE: true in prod, false in dev
  displayFilePath: 'hidden',
})

export const homeDir = os.homedir()
export const p2pRpcDir = concatPath([homeDir, '.p2pRpc'])
export const keysDir = concatPath([p2pRpcDir, 'keys'])
export const addressesDir = concatPath([p2pRpcDir, 'addresses'])

// TODO: rename port to httpPort, add p2pPort
// prettier-ignore
export type NodeConfig = {
  name:                 string
  // TODO: default to httpEndpoint port
  httpPort:             number
  p2pPort:              number
  // TODO: rename to exposedEndpoint
  httpEndpoint:         string    // exposed endpoint, it's mandatory for 
  isBootstrap:          boolean
  bootstrappers:        string[]
}
// prettier-ignore
export const defaultNodeConfig : NodeConfig = {
  name:                 "default",
  httpPort:             3000,
  p2pPort:              0,                        // run in random port
  httpEndpoint:         "http://127.0.0.1:3000",  // dummy default, it must specify in runtime
  isBootstrap:          false,
  bootstrappers:        [],
}
// prettier-ignore
export type State = {
  // node options
  node:                 NodeConfig
  // network options
  pingInterval:         Second
  failureN:             number    // i.e: now - last_ping_of_node > n * pingInterval => failure
  // runtime state
  lastSeen:             Date      // last other nodes endpoints requested
  otherNodesEndpoints:  Map<string, Date>
}
// prettier-ignore
export const defaultState: State = {
  node:                 defaultNodeConfig,
  pingInterval:         5,        // NOTE: 30 (sec) in production
  failureN:             2,
  lastSeen:             new Date(),
  otherNodesEndpoints:  new Map(),
}

export type Second = number

const failureThreshold = (s: State) => s.failureN * s.pingInterval

export function updateOtherEndpoints(s: State) {
  const now = new Date().getTime()
  const threshold = failureThreshold(s)
  if ((now - s.lastSeen.getTime()) / 1000 > threshold) {
    for (const [endpoint, expire] of s.otherNodesEndpoints.entries()) {
      if ((now - expire.getTime()) / 1000 > threshold)
        s.otherNodesEndpoints.delete(endpoint)
    }
  }
}

export function getOtherEndpoints(s: State): Map<string, Date> {
  updateOtherEndpoints(s)
  return s.otherNodesEndpoints
}
