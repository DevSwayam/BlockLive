const { ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { createInstance } = require("../scripts/helpers/createInstance")
const { toHexString } = require("../scripts/helpers/utils")
const { eventData, priceData } = require("../scripts/sampleData/data_incoEvent")

describe("Unit Tests", function () {
    // We define a fixture to reuse the same setup in every test.
    async function deploymentFixture() {
        const [deployer, tester] = await ethers.getSigners()
        const instance = await createInstance()

        const encryptedERC20Factory = await ethers.getContractFactory("EncryptedERC20")
        const erc20Contract = await encryptedERC20Factory.connect(deployer).deploy()

        // Deploying and Setting up the event Contract
        const eventFactory = await ethers.getContractFactory("incoEvent")
        const eventContract = await eventFactory.connect(deployer).deploy(
            deployer.address,
            eventData.uri,
            eventData.name,
            {
                price: 400000000,
                currency: "usdc",
                currencyAddress: erc20Contract.address,
            },
            eventData.description,
            eventData.location,
            eventData.start,
            eventData.end,
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
        await erc20Contract.mintAndApprove(eventContract.address, hexString)
    })


    it("Should let us buy ticket when Active inco-contract", async function () {
        const { instance, erc20Contract, eventContract, deployer, tester } =
            await deploymentFixture()
        const encryptedMintingAmount = instance.encrypt32(eventData.ticketPrice)
        const hexString = "0x" + toHexString(encryptedMintingAmount)
        const tx1 = await erc20Contract.mintAndApprove(eventContract.address, hexString)
        await tx1.wait()
        const transaction = await eventContract.buyToken(deployer.address, "usdc", hexString, {
            gasLimit: 9000000,
        })
        await transaction.wait()
        expect((await eventContract.getTokenIdCounter()).toNumber()).to.equal(1)
        expect(await eventContract.userToTokenId(deployer.address)).to.equal(0)
        expect(await eventContract.tokenIdToUserAddress(0)).to.equal(deployer.address)
    })

    it("Should set the right owner", async function () {
        const { instance, erc20Contract, eventContract, deployer, tester } =
            await deploymentFixture()

        const OWNER_ROLE = await eventContract.OWNER_ROLE()
        expect(await eventContract.hasRole(OWNER_ROLE, deployer.address)).to.equal(true)
    })

    it("Testing setActive Feature with buyToken Function", async function () {
        const { instance, erc20Contract, eventContract, deployer, tester } =
            await deploymentFixture()

        const tx = await eventContract.setActive(false)
        await tx.wait()
        expect(await eventContract.active()).to.equal(false)
        const encryptedMintingAmount = instance.encrypt32(eventData.ticketPrice)
        const hexString = "0x" + toHexString(encryptedMintingAmount)
        expect(
            await eventContract.buyToken(deployer.address, "usdc", hexString, {
                gasLimit: 9000000,
            })
        ).to.be.revertedWith("Not Active")
    })

    it("Should let users buy tickets when Active inco-contract", async function () {
        const { instance, erc20Contract, eventContract, deployer, tester } =
            await deploymentFixture()
        const encryptedMintingAmount = instance.encrypt32(eventData.ticketPrice)
        const hexString = "0x" + toHexString(encryptedMintingAmount)
        const tx1 = await erc20Contract.mintAndApprove(eventContract.address, hexString)
        await tx1.wait()
        const transaction = await eventContract.buyToken(deployer.address, "usdc", hexString, {
            gasLimit: 9000000,
        })
        await transaction.wait()
        expect((await eventContract.getTokenIdCounter()).toNumber()).to.equal(1)
        const tx2 = await erc20Contract
            .connect(tester)
            .mintAndApprove(eventContract.address, hexString)
        await tx2.wait()
        const transaction2 = await eventContract
            .connect(tester)
            .buyToken(deployer.address, "usdc", hexString, {
                gasLimit: 9000000,
            })
        await transaction2.wait()
        expect((await eventContract.getTokenIdCounter()).toNumber()).to.equal(2)
    })
})
