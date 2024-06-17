const { ethers, } = require("hardhat")
import { BigNumber } from "ethers";
const { AddressZero } = ethers.constants;

export const eventData = {
  ticketBase: [
    {
      key: "free",
      displayName: "free",
      maxSupply: 100,
      active: true,
      locked: false,
    },
    {
      key: "vip",
      displayName: "vip",
      maxSupply: 1000,
      active: true,
      locked: false,
      gated: false,
    },
    {
      key: "premium",
      displayName: "premium",
      maxSupply: 600,
      active: true,
      locked: false,
      gated: false,
    },
    {
      key: "extra",
      displayName: "extra",
      maxSupply: 500,
      active: true,
      locked: false,
      gated: false,
    },
    {
      key: "gated",
      displayName: "gated",
      maxSupply: 500,
      active: true,
      locked: false,
      gated: true,
    },
  ],
  ticketIds: ["free", "vip", "premium", "extra", "gated"],
  ticketNames: ["free", "vip", "premium", "extra", "gated"],
  amounts: [100, 1000, 600, 500, 500],
  uri: "https://blocklive.io/metadata/collection",
  details: {
    _name: "ATX DAO Native 8/8/22",
    _description:
      "All you can crytpo, free drinks with this NFT. Hang out with the ATX DAO.",
    _location: "Native Bar",
    _start: 1720968389,
    _end: 1721054789,
    _host: "ATX DAO",
    _thumbnail:
      "https://worldtop.mypinata.cloud/ipfs/QmbnfRbGnakbaBvXXQvpiLEydTQVvhuG6qALmWHsXnXBDW",
  },
};

export const priceData = {
  priceBase: [
    {
      tokenType: "free",
      price: 0,
      currency: "native",
      currencyAddress: AddressZero,
    },
    {
      tokenType: "vip",
      price: BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
      currency: "native",
      currencyAddress: AddressZero,
    },
    {
      tokenType: "premium",
      price: BigNumber.from("1000000000000000000"), // USD 6 decimals (2 USD)
      currency: "naitve",
      currencyAddress: AddressZero,
    },
    {
      tokenType: "extra",
      price: BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
      currency: "native",
      currencyAddress: AddressZero,
    },
    {
      tokenType: "gated",
      price: BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
      currency: "native",
      currencyAddress: AddressZero,
    },
  ],
  tickets: ["free", "vip", "premium", "extra", "gated"],
  costs: [
    0,
    BigNumber.from("1000000000000000000"), 
    BigNumber.from("1000000000000000000"),
    BigNumber.from("1000000000000000000"),
    BigNumber.from("1000000000000000000"),
  ],
  currencies: [
    "native",
    "native",
    "native",
    "native",
    "native",
  ],
};
