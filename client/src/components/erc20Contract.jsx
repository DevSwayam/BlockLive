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

const ERCAlertDialouge = ({ address, isOpen, setIsOpen }) => {
  const { toast } = useToast();
  const copyAddress = (e) => {
    e.preventDefault();
    try {
      navigator.clipboard.writeText(address);
    } catch (error) {
      console.log(error);
    }
    setIsOpen(false);
    toast({
      title: "Copied!",
      description: "Address, copied to clipboard",
    });
  };
  function truncateAddress(address) {
    return address.slice(0, 10) + "....." + address.slice(-4);
  }
  return (
    <AlertDialog open={isOpen} onOpenChange={(e) => setIsOpen(e)}>
      <AlertDialogContent className="">
        <AlertDialogHeader>
          <AlertDialogTitle>Copy Address</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="mt-10 flex flex-wrap text-black/75 text-xl justify-between scroll-m-20 border-b pb-6  font-semibold max-w-md overflow-auto tracking-tight transition-colors first:mt-0 text-wrap">
              <p>{truncateAddress(address)}</p>
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

export default ERCAlertDialouge;
