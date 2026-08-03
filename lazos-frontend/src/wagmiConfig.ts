import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { appChain, appRpcUrl } from './config/network'

export const config = appChain.id === base.id
  ? createConfig({
      chains: [base],
      transports: { [base.id]: http(appRpcUrl) },
      connectors: [injected()],
    })
  : createConfig({
      chains: [baseSepolia],
      transports: { [baseSepolia.id]: http(appRpcUrl) },
      connectors: [injected()],
    })
