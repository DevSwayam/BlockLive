const { ethers } = require("hardhat")
const { BigNumber } = require("ethers")
const { AddressZero } = ethers.constants

const eventData = {
    uri: "https://blocklive.io/metadata/collection",
    name: "ATX DAO Native 8/8/22",
    description: "All you can crytpo, free drinks with this NFT. Hang out with the ATX DAO.",
    location: "Native Bar",
    start: 1721774965,
    end: 1721775965,
    ticketPrice: 400000000,
    maxTokenSupply: 200,
}


module.exports = {
    eventData,
}
