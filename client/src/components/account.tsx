import { FallbackProvider, JsonRpcProvider } from "ethers";
import {
  useAccount,
  useChainId,
  useDeployContract,
  useDisconnect,
  useEnsName,
} from "wagmi";
import { Button } from "./ui/button";
import { getTransactionCount, switchChain } from "wagmi/actions";
import { config } from "@/wagmiProvider/config";
import { incoNetwork } from "@/wagmiProvider/chainConfig";
import { useEffect, useState } from "react";
import { getInstance, provider, getTokenSignature } from "@/utils/fhevm";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { byteCode } from "@/utils/byteCode";
import AlertDialouge from "./alert-dialouge";
import Link from "next/link";
import { eventABI } from "@/abi/EventABI";
import { getContractAddress } from "viem";
import { erc20Bytecode } from "@/utils/erc20Bytecode";
import { abi } from "@/abi/ERC20ABI";
import ERCAlertDialouge from "./erc20Contract";

let instance;
export function Account() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const chainId = useChainId();
  const { deployContract } = useDeployContract();
  const [erc20ContractAddress, setErc20ContractAddress] = useState("");
  const [formValues, setFormValues] = useState({
    formAddress: address,
    uri: "https://blocklive.io/metadata/collection",
    name: "ATX DAO Native 8/8/22",
    tokenPrice: 400000000,
    tokenName: "usdc",
    tokenAddress: "",
    evtDescription:
      "All you can crytpo, free drinks with this NFT. Hang out with the ATX DAO",
    evtLocation: "Native Bar",
    evtStartTime: 1721774965,
    evtEndTime: 1721775965,
    evtTokenSupply: 200,
  });
  const [responseAddress, setResponseAddress] = useState("");
  const [alertDialouge, setAlertDialouge] = useState(false);
  const [ercAlertDialouge, setErcAlertDialouge] = useState("");
  useEffect(() => {
    setFormValues((prevValues) => ({
      ...prevValues,
      tokenAddress: erc20ContractAddress,
    }));
  }, [erc20ContractAddress]);

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  const formFields = [
    { id: "formAddress", label: "Address" },
    { id: "uri", label: "URI" },
    { id: "name", label: "Name" },
    { id: "tokenPrice", label: "Token Price" },
    { id: "tokenName", label: "Token Name" },
    { id: "tokenAddress", label: "Token Address" },
    { id: "evtDescription", label: "Event Description" },
    { id: "evtLocation", label: "Event Location" },
    { id: "evtStartTime", label: "Event Start Time" },
    { id: "evtEndTime", label: "Event End Time" },
    { id: "evtTokenSupply", label: "Event Token Supply" },
  ];

  const getContractAddressFunction = async (setter: any, alerDialouge: any) => {
    const transactionCount = await getTransactionCount(config, {
      address: address,
    });
    const contractAddress = await getContractAddress({
      from: address,
      nonce: transactionCount,
    });
    setter(contractAddress);
    alerDialouge(true);
  };

  const handleFormSubmit = async () => {
    const data = [
      formValues.formAddress,
      formValues.uri,
      formValues.name,
      {
        price: 400000000,
        currency: "usdc",
        currencyAddress: formValues.tokenAddress,
        // price: formValues.tokenPrice,
        // currency: formValues.tokenName,
        // currencyAddress: formValues.tokenAddress,
      },
      formValues.evtDescription,
      formValues.evtLocation,
      formValues.evtStartTime,
      formValues.evtEndTime,
      formValues.evtTokenSupply,
    ];
    deployContract(
      {
        abi: eventABI,
        args: data,
        bytecode: byteCode,
      },
      {
        onSuccess(data, variables, context) {
          console.log(data);
          getContractAddressFunction(setResponseAddress, setAlertDialouge);
        },
        onError(error, variables, context) {
          console.log(error);
        },
        onSettled(data, error, variables, context) {
          console.log(data);
        },
      }
    );
  };

  const deployERC20Contract = async () => {
    deployContract(
      {
        abi: abi,
        args: [],
        bytecode: erc20Bytecode,
      },
      {
        onSuccess(data, variables, context) {
          console.log(data);
          getContractAddressFunction(
            setErc20ContractAddress,
            setErcAlertDialouge
          );
        },
        onError(error, variables, context) {
          console.log(error);
        },
        onSettled(data, error, variables, context) {
          console.log(data);
        },
      }
    );
  };

  useEffect(() => {
    async function fetchInstance() {
      instance = await getInstance();
    }
    fetchInstance();
  }, []);

  function truncateAddress(address: string) {
    return address.slice(0, 5) + "....." + address.slice(-4);
  }
  const switchChainToInco = async () => {
    try {
      await switchChain(config, {
        addEthereumChainParameter: {
          iconUrls: [
            "https://img.cryptorank.io/coins/150x150.inco_network1708524859049.png",
          ],
        },
        chainId: incoNetwork.id,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="mt-20 grid gap-6 pb-16">
      {responseAddress !== "" && (
        <AlertDialouge
          erc20ContractAddress={erc20ContractAddress}
          isOpen={alertDialouge}
          address={responseAddress}
          setIsOpen={setAlertDialouge}
        />
      )}
      {erc20ContractAddress !== "" && (
        <ERCAlertDialouge
          isOpen={ercAlertDialouge}
          address={erc20ContractAddress}
          setIsOpen={setErcAlertDialouge}
        />
      )}
      <div className="mt-10 flex justify-between scroll-m-20 border-b pb-6 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        <div>
          Wallet Address:{" "}
          {address && (
            <>
              <div className="text-xl text-black/70 hidden md:flex">
                {ensName ? `${ensName} (${address})` : address}
              </div>
              <div className="text-xl text-black/70 md:hidden flex">
                {ensName ? `${ensName} (${address})` : truncateAddress(address)}
              </div>
            </>
          )}
        </div>
        {chainId === 9090 ? (
          <div className="flex gap-4 items-center">
            <Link href={"/buy-token"}>
              <Button variant={"neutral"}>Buy Token</Button>
            </Link>

            <Button onClick={() => disconnect()}>Disconnect</Button>
          </div>
        ) : (
          <div>
            <Button onClick={switchChainToInco}>Switch Chain</Button>
          </div>
        )}
      </div>
      <h2 className="text-2xl font-semibold">Step 1: Deploy your ERC20 contract</h2>
      <div>
        <Button onClick={deployERC20Contract}>Deploy Erc 20 contract</Button>
      </div>
      <div className="mt-10 flex justify-between scroll-m-20 border-b pb-6 text-3xl font-semibold tracking-tight transition-colors first:mt-0"></div>
      <h2 className="text-2xl font-semibold">Step 2: Deploy your event contract</h2>
      <div className="grid grid-cols-2 mt-6 gap-8">
        {formFields.map(({ id, label }) => (
          <div key={id} className="grid gap-2 md:grid-cols-2 items-center">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              onChange={handleChange}
              value={formValues[id]}
              placeholder={label}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end">
        <Button onClick={handleFormSubmit}>Submit</Button>
      </div>
    </div>
  );
}
