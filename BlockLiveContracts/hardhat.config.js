require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

const COMPILER_SETTINGS = {
    optimizer: {
        enabled: true,
        runs: 1000000,
    },
    metadata: {
        bytecodeHash: "none",
    },
}

const INCO_RPC_URL = process.env.INCO_RPC_URL || "https://testnet.inco.org"
const PRIVATE_KEY = process.env.PRIVATE_KEY

const MNEMONIC = process.env.MNEMONIC || "Your mnemonic"
const FORKING_BLOCK_NUMBER = parseInt(process.env.FORKING_BLOCK_NUMBER) || 0

const REPORT_GAS = process.env.REPORT_GAS || false

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.22",
        settings: {
            metadata: {
              // Not including the metadata hash
              // https://github.com/paulrberg/hardhat-template/issues/31
              bytecodeHash: "none",
            },
            // Disable the optimizer when debugging
            // https://hardhat.org/hardhat-network/#solidity-optimizer-support
            viaIR: true,
            optimizer: {
              enabled: true,
              runs: 2,
            },
          },
        compilers: [
            {
                version: "0.8.20",
                settings: COMPILER_SETTINGS,
            },
            {
                version: "0.8.21",
                settings: COMPILER_SETTINGS,
            },
            {
                version: "0.8.22",
                settings: COMPILER_SETTINGS,
            },
            {
                version: "0.8.23",
                settings: COMPILER_SETTINGS,
            },
        ],
    },
    networks: {
        localhost: {
            chainId: 31337,
        },
        inco: {
            url: INCO_RPC_URL !== undefined ? INCO_RPC_URL : "https://testnet.inco.org",
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            chainId: 9090,
        }
    },
    defaultNetwork: "inco",
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    contractSizer: {
        runOnCompile: false,
        only: [
            "APIConsumer",
            "AutomationCounter",
            "NFTFloorPriceConsumerV3",
            "PriceConsumerV3",
            "RandomNumberConsumerV2",
            "RandomNumberDirectFundingConsumerV2",
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./build/cache",
        artifacts: "./build/artifacts",
    },
    mocha: {
        timeout: 300000, // 300 seconds max for running tests
    },
}