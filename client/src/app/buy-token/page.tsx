"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { abi as erc20ABI } from "@/abi/ERC20ABI";
import { getInstance } from "@/utils/fhevm";
import { toHexString } from "@/utils/utils";
import { readContract, watchContractEvent, writeContract } from "wagmi/actions";
import { config } from "@/wagmiProvider/config";
import { useToast } from "@/components/ui/use-toast";
import { eventABI } from "@/abi/EventABI";
import TicketPopup from "@/components/ticket-popup";
const sampleData = {
  creator: "0x1234567890abcdef1234567890abcdef12345678",
  nameContract: "Concert",
  eventDescription: "A live music concert featuring top artists.",
  location: "Madison Square Garden, NY",
  eventStartTime: 1711113600, // Example Unix timestamp for start time
  eventEndTime: 1711128000, // Example Unix timestamp for end time
  ticketPrice: 100,
  ticketCounter: 99,
};

const Page = () => {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    erc20ContractAddress: "",
    eventContractAddress: "",
  });
  const [data, setData] = useState(sampleData);
  const formFields = [
    { id: "erc20ContractAddress", label: "ERC Contract Address" },
    { id: "eventContractAddress", label: "Event Contract Address" },
  ];
  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  const handleFormSubmit = async () => {
    const data = [
      formValues.erc20ContractAddress,
      formValues.eventContractAddress,
    ];

    setIsSubmitted(true);
  };

  const getERC20Tokens = async () => {
    try {
      const instance = await getInstance();
      const encryptedString = await instance.encrypt32(400000000);
      const hexString = "0x" + toHexString(encryptedString);
      const result = await writeContract(config, {
        abi: erc20ABI,
        address: formValues.erc20ContractAddress,
        functionName: "mintAndApprove",
        args: [formValues.eventContractAddress, hexString],
      });
      console.log(formValues.eventContractAddress);
      console.log(result);
    } catch (error) {
      let errorMessage;
      let indexOfDot = error.message.indexOf(".");
      if (indexOfDot !== -1) {
        errorMessage = error.message.slice(0, indexOfDot + 1);
      }
      console.log(error);
      toast({
        title: errorMessage,
        description: "Unexpected Error!",
      });
    }
  };

  const watchContract = watchContractEvent(config, {
    address: formValues.eventContractAddress,
    abi: eventABI,
    eventName: "TokenPurchased",
    onLogs(logs) {
      console.log("New logs!", logs);
      setIsOpen(true);
    },
  });

  const buyEventTickets = async () => {
    try {
      const instance = await getInstance();
      const encryptedString = await instance.encrypt32(400000000);
      const hexString = "0x" + toHexString(encryptedString);
      // console.log(hexString);
      const result = await writeContract(config, {
        abi: eventABI,
        address: formValues.eventContractAddress,
        functionName: "buyToken",
        args: [address, "usdc", hexString],
      });
      console.log([
        formValues.eventContractAddress,
        address,
        "usdc",
        hexString,
      ]);
      if (result) {
        console.log(result);
        watchContract();
      }
    } catch (error) {
      let errorMessage;
      let indexOfDot = error.message.indexOf(".");
      if (indexOfDot !== -1) {
        errorMessage = error.message.slice(0, indexOfDot + 1);
      }
      console.log(error);
      toast({
        title: errorMessage,
        description: "Unexpected Error!",
      });
    }
  };

  return (
    <div className="mt-20 flex flex-col gap-6 pb-16">
      <TicketPopup
        sampleData={data}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        eventContractAddress={formValues.eventContractAddress}
      />
      <div className="mt-10 flex justify-between scroll-m-20 border-b pb-6 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Buy Token
      </div>
      {isSubmitted ? (
        <>
          <div className="grid mt-10 gap-8">
            <div className="space-y-2">
              <p className="flex justify-between scroll-m-20 text-xl font-bold">
                Step 1: Get ERC 20 Token
              </p>
              <p className="text-sm">
                To participate in our event, you first need to obtain an ERC 20
                token. This token will be used to access various features and
                benefits exclusive to token holders. Ensure you have a
                compatible wallet to store your tokens securely. Once you have
                the token, you'll be ready for the next step.
              </p>
              <div className="w-full grid place-items-end">
                <Button onClick={getERC20Tokens}>Get ERC Token</Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="flex justify-between scroll-m-20 text-xl font-bold">
                Step 2: Buy Event Ticket
              </p>
              <p className="text-sm">
                With your ERC 20 token in hand, you can now purchase an event
                ticket. The ticket grants you entry to the event and unlocks
                additional perks available only to attendees. Make sure to buy
                your ticket early to{"  "}
                {/* <span className="bg-main px-2 border-2 rounded-sm font-semibold"> */}
                secure your spot
                {/* </span> */}
                {"  "}
                and enjoy all the exclusive activities.
              </p>
              <div className="w-full grid place-items-end">
                <Button onClick={buyEventTickets}>Buy Event Ticket</Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 mt-10 gap-8">
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
        </>
      )}
    </div>
  );
};

export default Page;
