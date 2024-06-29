import { http, createConfig } from "wagmi";
import { injected, safe, walletConnect, metaMask } from "wagmi/connectors";
import { incoNetwork } from "./chainConfig";
import { sepolia } from "viem/chains";

export const config = createConfig({
  chains: [incoNetwork],
  ssr: true,
  connectors: [injected(), metaMask()],
  transports: {
    [incoNetwork.id]: http("https://testnet.inco.org/"),
    // [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/..."),
    // [sepolia.id]: http(),
  },
});
