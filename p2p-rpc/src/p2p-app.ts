import { log, NodeConfig, State } from './state.js'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { identify, identifyPush } from '@libp2p/identify'
import { tcp } from '@libp2p/tcp'
import { createLibp2p } from 'libp2p'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'
import { readKeyFile } from './keypair.js'

export async function runP2p(s: State) {
  const node = await mkNode(s.node)

  log.info('Node started with id:', node.peerId.toString())
  node
    .getMultiaddrs()
    .forEach((addr) => log.info(`Listening on: ${addr.toString()}`))

  node.addEventListener('peer:discovery', (evt) =>
    log.info('Discovered %s', evt.detail.id.toString())
  )

  node.addEventListener('peer:connect', (evt) =>
    log.info('Connected to %s', evt.detail.toString())
  )

  node.services.pubsub.addEventListener('message', (evt) =>
    pubsubEventHandler(evt, s)
  )

  node.services.pubsub.addEventListener('subscription-change', (evt) => {
    log.info('evt', evt)
    const subs = node.services.pubsub.getSubscribers(newNodeAnnTopic) // debug
    log.debug(`subscribers: ${subs}`) // debug
  })

  node.services.pubsub.subscribe(newNodeAnnTopic)
  log.info(`subscribed to: ${newNodeAnnTopic}`)

  setInterval(() => {
    log.debug('📤 Sending:', s.node.httpEndpoint)
    node.services.pubsub
      .publish(newNodeAnnTopic, new TextEncoder().encode(s.node.httpEndpoint))
      // TODO:
      .catch((_err) => {})
  }, s.pingInterval * 1000)
}

function pubsubEventHandler(evt: CustomEvent, s: State) {
  const topic = evt.detail.topic
  const data = new TextDecoder().decode(evt.detail.data)
  log.info(`${topic}: ${data}`)

  if (topic == newNodeAnnTopic) s.otherNodesEndpoints.set(data, new Date())

  log.debug(
    "other nodes' endpoints: ",
    s.otherNodesEndpoints.entries().toArray()
  )
}

const newNodeAnnTopic = 'new-node-announcement'

// prettier-ignore
const mkNode = async (conf: NodeConfig) =>
  await createLibp2p({
    transports:           [tcp()],
    streamMuxers:         [yamux()],
    connectionEncrypters: [noise()],
    addresses: {
      listen:             [`/ip4/0.0.0.0/tcp/${conf.p2pPort}`],
    },
    privateKey:           getPrivateKey(conf.name),
    peerDiscovery:        ((b) => b.length != 0
                            ? [bootstrap({ list: b })]
                            : []
                          )(conf.bootstrappers),
    services: {
      pubsub:             gossipsub({ doPX: conf.isBootstrap }),
      identify:           identify(),
      identifyPush:       identifyPush(),
    },
  })

const getPrivateKey = (nodeName: string) =>
  privateKeyFromRaw(readKeyFile(nodeName))
