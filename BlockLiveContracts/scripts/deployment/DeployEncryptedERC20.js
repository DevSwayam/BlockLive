const {ethers} = require("hardhat")

async function deployEncryptedERC20() {
    const eventUriBase = "https://example.com/api/tickets";
    const eventName = "SampleEvent";

    const accounts = await ethers.getSigners();
    const deployer = accounts[0];

    let encryptedERC20;

    const encryptedERC20Factory = await ethers.getContractFactory("EncryptedERC20");
    encryptedERC20 = await encryptedERC20Factory.connect(deployer).deploy(deployer.address);
    return encryptedERC20.address;
}
module.exports = {
    deployEncryptedERC20,
}