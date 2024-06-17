const fhevmjs = require("fhevmjs")
const { ethers } = require("hardhat")

let publicKey
let chainId

const createInstance = async () => {
    if (!publicKey || !chainId) {
        // 1. Get chain id
        const FHE_LIB_ADDRESS = "0x000000000000000000000000000000000000005d";
        const provider = ethers.provider

        const network = await provider.getNetwork()
        chainId = +network.chainId.toString() // Need to be a number

        // Get blockchain public key
        const ret = await provider.call({
            to: FHE_LIB_ADDRESS,
            // first four bytes of keccak256('fhePubKey(bytes1)') + 1 byte for library
            data: "0xd9d47bb001",
        })
        const decoded = ethers.utils.defaultAbiCoder.decode(["bytes"], ret)
        publicKey = decoded[0]
    }

    const instance = await fhevmjs.createInstance({ chainId, publicKey })

    return instance
}

module.exports = {
    createInstance
}
