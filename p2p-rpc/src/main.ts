import { comp, expect, unOpt } from './fp.js'
import fs from 'fs'
import yaml from 'yaml'
import { addKeyFile } from './keypair.js'
import {
  defaultState,
  getOtherEndpoints,
  log,
  NodeConfig,
  State,
} from './state.js'
import { runP2p } from './p2p-app.js'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

// -----------------------------------------------------------------------------
// -- main

main()

async function main() {
  const args = process.argv.slice(2)
  const confPath = ((p) => (p ? p : './p2p-rpc.yaml'))(args[0])
  runApp(confPath)

  // NOTE: add these lines in case of commands needed
  // program
  //   // TODO: add default confPath
  //   .command('run <path>', { isDefault: true })
  //   .description('run node with name')
  //   // .option('-c, --confPath <path>', 'specify node config path')
  //   .action(runApp)
  // program
  //   .command('new <name>')
  //   .description('make new node with name')
  //   .action(addKeyFile)
  // program.parse()
}

async function runApp(confPath: string) {
  log.debug(`confPath: ${confPath}`)
  const nodeConf: NodeConfig = yaml.parse(fs.readFileSync(confPath, 'utf8'))

  addKeyFile(nodeConf.name)

  // TODO: make httpPort default to httpEndpoint port
  const s: State = {
    ...defaultState,
    node: {
      ...nodeConf,
      httpEndpoint: expect(
        'httpEndpoint must be specified!',
        unOpt,
        nodeConf.httpEndpoint
      ),
    },
  }

  log.debug('state:', s)

  await runP2p(s)

  runHttp(s)
}

// -----------------------------------------------------------------------------
// -- http server

function runHttp(s: State) {
  const app = new Hono()

  app.get('/', (c) =>
    comp([c.text, JSON.stringify, Object.fromEntries, getOtherEndpoints])(s)
  )

  serve(
    {
      fetch: app.fetch,
      port: s.node.httpPort,
    },
    (info) => log.info(`Listening on http://localhost:${info.port}`)
  )
}
