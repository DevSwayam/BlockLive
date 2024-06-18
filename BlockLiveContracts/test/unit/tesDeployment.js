const { ethers } = require("hardhat");
const { assert, expect } = require("chai");
const { createInstance } = require("../../scripts/helpers/createInstance");
const { toHexString } = require("../../scripts/helpers/utils");
const { eventData, priceData } = require("../../scripts/sampleData/data_paidSingle");

describe("Test EncryptedERC20 Unit Tests", function () {
    // We define a fixture to reuse the same setup in every test.
    async function deploymentFixture() {
        const [deployer] = await ethers.getSigners();
        const instance = await createInstance();

        const encryptedERC20Factory = await ethers.getContractFactory("EncryptedERC20");
        const erc20Contract = await encryptedERC20Factory.connect(deployer).deploy();
        const erc20Contract1 = await encryptedERC20Factory.connect(deployer).deploy();

        // Deploying and Setting up the event Contract
        const eventFactory = await ethers.getContractFactory("Event");
        const eventContract = await eventFactory
            .connect(deployer)
            .deploy(deployer.address, eventData.uri, eventData.details._name, [], [], [], [], []);

        priceData.priceBase[0].currencyAddress = erc20Contract.address;
        priceData.priceBase[1].currencyAddress = erc20Contract1.address;
        await eventContract.registerTokenType(eventData.ticketBase);
        await eventContract.registerCurrency(priceData.priceBase);

        // Setting up the Erc20 Contract so that event can read encrypted Balance
        await erc20Contract.setBalanceReader(eventContract.address);

        return {  instance, erc20Contract, eventContract, deployer}
    }

    describe("deployment", function () {
        describe("success", function () {
            it("should set the Erc20 Contract name correctly", async () => {
                const {instance, erc20Contract, eventContract, deployer } = await deploymentFixture();
                const response = await erc20Contract.decimals();
                assert.equal(response, 18);
            })
        })
    })

    describe("test mint", function () {
        describe("success", function () {
            it("should mint the ERC20 Tokens", async () => {
                const { instance, erc20Contract, eventContract, deployer } = await deploymentFixture();
                const encryptedMintingAmount = instance.encrypt32(1000);
                const hexString = "0x" + toHexString(encryptedMintingAmount);
                const result = await erc20Contract.mint(hexString);
            })
        })
    })

    describe("test mint and approve tokens", function () {
        describe("success", function () {
            it("should mint the ERC20 Tokens", async () => {
                const { instance, erc20Contract, eventContract, deployer } = await deploymentFixture();
                const encryptedMintingAmount = instance.encrypt32(1000);
                const hexString = "0x" + toHexString(encryptedMintingAmount);
                await erc20Contract.mint(hexString);
                await erc20Contract.approve(eventContract.address,hexString);

            })
        })
    })

    
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { instance, erc20Contract, eventContract, deployer } = await deploymentFixture();
          const OWNER_ROLE = await eventContract.OWNER_ROLE();
          expect(await eventContract.hasRole(OWNER_ROLE, deployer.address)).to.equal(true);
        });
    })
})
