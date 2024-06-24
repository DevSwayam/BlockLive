const { ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { createInstance } = require("../scripts/helpers/createInstance")
const { toHexString } = require("../scripts/helpers/utils")
const { eventData } = require("../scripts/sampleData/data_incoEvent")

describe("Unit Tests", function () {
    // We define a fixture to reuse the same setup in every test.
    async function deploymentFixture() {
        const [deployer, tester] = await ethers.getSigners()
        const instance = await createInstance()

        const encryptedERC20Factory = await ethers.getContractFactory("EncryptedERC20")
        const erc20Contract = await encryptedERC20Factory.connect(deployer).deploy()

        // Deploying and Setting up the event Contract
        const eventFactory = await ethers.getContractFactory("incoEvent")
        const eventContract = await eventFactory
            .connect(deployer)
            .deploy(
                deployer.address,
                eventData.uri,
                eventData.name,
                eventData.description,
                eventData.location,
                eventData.start,
                eventData.end,
                eventData.host,
                eventData.thumbnail,
                eventData.ticketPrice,
                erc20Contract.address,
                eventData.maxTokenSupply
            )

        console.log("Event Contract Address is : ", eventContract.address)

        return { instance, erc20Contract, eventContract, deployer, tester }
    }

    it("should mint and approve the ERC20 Tokens", async () => {
        const { instance, erc20Contract, eventContract, deployer, tester } =
            await deploymentFixture()
        // ERC20 Contract tests for Mint and Approve
        const encryptedMintingAmount = instance.encrypt32(1000)
        const hexString = "0x" + toHexString(encryptedMintingAmount)
        await erc20Contract.mintAndApprove(eventContract.address, hexString);

    })

    it("Should not allow us to buy when not active", async function () {
        const { instance, erc20Contract, eventContract, deployer, tester } =
            await deploymentFixture()

        // Set inactive, fail to buy ticket
        await eventContract.setActive(false)
        await expect(eventContract["buyToken(address)"](owner.address)).to.be.revertedWith(
            "Not active"
        )
    })

    it("Should let us buy tickets when Active inco-contract", async function () {
        const { instance, erc20Contract, eventContract, deployer, tester } =
            await deploymentFixture()
        const encryptedMintingAmount = instance.encrypt32(eventData.ticketPrice)
        const hexString = "0x" + toHexString(encryptedMintingAmount)
        const tx1 = await erc20Contract.mintAndApprove(eventContract.address, hexString);
        await tx1.wait()
        const transaction = await eventContract.buyToken(deployer.address, hexString, {
            gasLimit: 9000000,
        })
        console.log("Transaction hash:", transaction.hash)
        await transaction.wait()
        expect((await eventContract.getTokenIdCounter()).toNumber()).to.equal(1)
    })
})
