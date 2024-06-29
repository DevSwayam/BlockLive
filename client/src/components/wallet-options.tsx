import * as React from "react";
import { Connector, useConnect } from "wagmi";
import { Button } from "./ui/button";

export function WalletOptions() {
  const { connectors, connect } = useConnect();
  // console.log(connectors);
  return (
    <div className="flex flex-col gap-12 justify-center mt-20 pb-20">
      <h2 className="mt-10 scroll-m-20 border-b pb-6 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Connect Wallet
      </h2>
      <div className="grid md:grid-cols-3 w-full gap-6">
        {connectors.map((connector) => (
          <Button
            className="p-6 flex items-center transition-all ease-linear duration-400 md:text-xl font-medium justify-center w-full py-10 md:min-h-32 min-h-24 hover:bg-white/25 bg-main"
            key={connector.uid}
            // variant={'reverse'}
            onClick={() => connect({ connector })}
          >
            {connector?.icon && <img src={connector.icon} className="mx-3" />}
            {connector.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
