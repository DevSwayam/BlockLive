const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { AddressZero } = ethers.constants;

const eventData = {
  ticketBase: [
    {
      key: "premium",
      displayName: "premium",
      maxSupply: 2000,
      active: true,
      locked: false,
    },
  ],
  ticketIds: ["premium"],
  ticketNames: ["premium"],
  amounts: [2000],
  uri: "https://blocklive.io/metadata/collection",
  details: {
    _name: "ATX DAO Native 8/8/22",
    _description:
      "All you can crytpo, free drinks with this NFT. Hang out with the ATX DAO.",
    _location: "Native Bar",
    _start: 1662683400,
    _end: 1662690600,
    _host: "ATX DAO",
    _thumbnail:
      "https://worldtop.mypinata.cloud/ipfs/QmbnfRbGnakbaBvXXQvpiLEydTQVvhuG6qALmWHsXnXBDW",
  },
};

const priceData = {
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
      currency: "native",
      currencyAddress: AddressZero,
    },
    {
      tokenType: "extra",
      price: BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
      currency: "native",
      currencyAddress: AddressZero,
    },
    {
      tokenType: "extra",
      price: BigNumber.from("1000000000000000000"), // USD 6 decimals (2 USD)
      currency: "native",
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
    BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
    BigNumber.from("1000000000000000000"), // USD 6 decimals (2 USD)
    BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
    BigNumber.from("1000000000000000000"), // USD 6 decimals (2 USD),
    BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
    BigNumber.from("1000000000000000000"), // ETH 18 decimals (1 ETH)
  ],
  currencies: [
    "native",
    "native",
    "usdc",
    "native",
    "usdc",
    "native",
    "native",
  ],
};

module.exports = {
  eventData,
  priceData
}
