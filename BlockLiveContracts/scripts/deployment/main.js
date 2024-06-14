const { ethers, network, run } = require("hardhat")
const { deployEvent } =  require("./DeployEvent.js");
const { deployEncryptedERC20 } =  require("./DeployEncryptedERC20.js");

async function main() {
    await run("compile")
    const eventContractAddress = await deployEvent();
    const EncryptedERC20Address = await deployEncryptedERC20(eventContractAddress);

    console.log("Event Contract addresses is : ", eventContractAddress);
    console.log("EncryptedERC20 Contract addresses is : ", EncryptedERC20Address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})