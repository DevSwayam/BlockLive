import { type Chain } from "viem";

const AUTHORIZED_CHAIN_ID = [9090, 9091];
export const incoNetwork = {
  id: AUTHORIZED_CHAIN_ID[0],
  name: "Inco Gentry Testnet",
  nativeCurrency: { name: "INCO", symbol: "INCO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.inco.org/"] },
  },
  blockExplorers: {
    default: {
      name: "Inco Testnet explorer",
      url: "https://explorer.testnet.inco.org/",
    },
  },
} as const satisfies Chain;
