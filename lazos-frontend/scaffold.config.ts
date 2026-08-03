import { appChain, appRpcUrl } from "./src/config/network";

export const DEFAULT_ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

const scaffoldConfig = {
  // 👇 Red en la que estás trabajando
  targetNetworks: [appChain],

  // 👇 Intervalo de actualización de datos (en milisegundos)
  pollingInterval: 30000,

  // 👇 Tu API Key de Alchemy
  alchemyApiKey: DEFAULT_ALCHEMY_API_KEY,

  // 👇 Tu RPC personalizado (el que pusiste en .env.local)
  rpcOverrides: {
    [appChain.id]: appRpcUrl,
  },

  // 👇 Si usas WalletConnect
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",

  // 👇 Para usar solo burner wallet local (opcional)
  onlyLocalBurnerWallet: false,
} as const;

export default scaffoldConfig;
