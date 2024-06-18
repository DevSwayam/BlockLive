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
      price: 4000000000,
      currency: "native",
      currencyAddress: AddressZero,
    }
  ],
  tickets: ["free","vip"],
  costs: [
    0,
    4000000000
  ],
  currencies: [
    "native",
    "native"
  ],
};

module.exports = {
  eventData,
  priceData
}
