import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "./ui/use-toast";

type AlertDialogProps = {
  erc20ContractAddress: string;
  address: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};
const AlertDialouge: React.FC<AlertDialogProps> = ({
  erc20ContractAddress,
  address,
  isOpen,
  setIsOpen,
}) => {
  const { toast } = useToast();
  const copyAddress = (e) => {
    e.preventDefault();
    try {
      navigator.clipboard.writeText(
        `Event Contract Address: ${address} \nERC20 Contract Address: ${erc20ContractAddress}`
      );
    } catch (error) {
      console.log(error);
    }
    setIsOpen(false);
    toast({
      title: "Copied!",
      description: "Address, copied to clipboard",
    });
  };
  function truncateAddress(address: string) {
    return address.slice(0, 4) + "....." + address.slice(-4);
  }
  return (
    <AlertDialog open={isOpen} onOpenChange={(e) => setIsOpen(e)}>
      <AlertDialogContent className="">
        <AlertDialogHeader>
          <AlertDialogTitle>
            You need to copy below contract addresses
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="mt-10 flex flex-col text-xl justify-between scroll-m-20 border-b pb-6  font-semibold max-w-md overflow-auto tracking-tight transition-colors first:mt-0 text-wrap">
              <div className="flex items-center justify-between"></div>
              <p className="text-black">
                Event Contract Address:
                <span className="text-black/75">
                  {" "}
                  {truncateAddress(address)}
                </span>
              </p>
              <p className="text-black">
                ERC20 Contract Address:
                <span className="text-black/75">
                  {" "}
                  {truncateAddress(erc20ContractAddress)}
                </span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={copyAddress}>
            Copy Address
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialouge;
