const {ethers} = require("hardhat")

async function deployEncryptedERC20() {

    const accounts = await ethers.getSigners();
    const deployer = accounts[0];

    let encryptedERC20;

    const encryptedERC20Factory = await ethers.getContractFactory("EncryptedERC20");
    encryptedERC20 = await encryptedERC20Factory.connect(deployer).deploy();
    return encryptedERC20;
}
module.exports = {
    deployEncryptedERC20,
}