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
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  eventContractAddress: string;
  sampleData: {
    creator: any;
    nameContract: any;
    eventDescription: any;
    location: any;
    eventStartTime: any;
    eventEndTime: any;
    ticketPrice: any;
    ticketCounter: any;
  };
};
const TicketPopup: React.FC<AlertDialogProps> = ({
  isOpen,
  setIsOpen,
  eventContractAddress,
  sampleData,
}) => {
  const { toast } = useToast();

  return (
    <AlertDialog open={isOpen} onOpenChange={(e) => setIsOpen(e)}>
      <AlertDialogContent className="">
        {/* <AlertDialogHeader>
          <AlertDialogTitle>Ticket</AlertDialogTitle>
          <AlertDialogDescription> */}
        <div className="w-full items-center justify-center">
          <TicketCard {...sampleData} />
        </div>
        {/* </AlertDialogDescription>
        </AlertDialogHeader> */}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TicketPopup;

interface TicketCardProps {
  creator: string;
  nameContract: string;
  eventDescription: string;
  location: string;
  eventStartTime: any;
  eventEndTime: any;
  ticketPrice: number;
}

const TicketCard: React.FC<TicketCardProps> = ({
  creator,
  nameContract,
  eventDescription,
  location,
  eventStartTime,
  eventEndTime,
  ticketPrice,
}) => {
  function truncateAddress(address: string) {
    return address.slice(0, 10) + "....." + address.slice(-4);
  }
  return (
    <div className="">
      <div className="py-4">
        <div className="flex w-full justify-between items-center">
          <div className="font-bold text-xl mb-2">{nameContract}</div>
          <p className="text-sm font-bold text-green-700">99+ Registred</p>
        </div>

        <p className="mt-4">
          <span className="font-semibold text-black">Description:</span>{" "}
          {eventDescription}
        </p>
        <p>
          <span className="font-semibold text-black">Location:</span> {location}
        </p>
        <p>
          <span className="font-semibold text-black">Start Time:</span>{" "}
          {new Date(eventStartTime * 1000).toLocaleString()}
        </p>
        <p>
          <span className="font-semibold text-black">End Time:</span>{" "}
          {new Date(eventEndTime * 1000).toLocaleString()}
        </p>
        <p>
          <span className="font-semibold text-black">Ticket Price:</span> $
          {ticketPrice}
        </p>
      </div>
      <div className="pt-2 pb-6">
        <span className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          Creator: {truncateAddress(creator)}
        </span>
      </div>

      <AlertDialogFooter>
        {/* <AlertDialogCancel>Cancel</AlertDialogCancel> */}
        <AlertDialogAction>Okay!</AlertDialogAction>
      </AlertDialogFooter>
    </div>
  );
};
