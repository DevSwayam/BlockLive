const { deployEvent } =  require("./DeployEvent.js");
const { deployEncryptedERC20 } =  require("./DeployEncryptedERC20.js");

async function main() {
    // Referrence to interact
    let eventContract;
    let encryptedErc20Contract;

    //Deploy
    await run("compile")
    encryptedErc20Contract = await deployEncryptedERC20();
    eventContract = await deployEvent();
    console.log("Event Contract addresses is : ", eventContract.address);
    console.log("EncryptedERC20 Contract addresses is : ", encryptedErc20Contract.address);

    // Setup 
    const contractName = await encryptedErc20Contract.name();
    console.log("Name of Contract is: ", contractName);
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})