const { ethers } = require("hardhat");
const { assert, expect } = require("chai");
const { createInstance } = require("../scripts/helpers/createInstance");
const { toHexString } = require("../scripts/helpers/utils");
const { eventData, priceData } = require("../scripts/sampleData/data_paidSingle");

describe("Unit Tests", function () {
    // We define a fixture to reuse the same setup in every test.
    async function deploymentFixture() {
        const [deployer, tester] = await ethers.getSigners();
        const instance = await createInstance();

        const encryptedERC20Factory = await ethers.getContractFactory("EncryptedERC20");
        const erc20Contract = await encryptedERC20Factory.connect(deployer).deploy();
        const erc20Contract1 = await encryptedERC20Factory.connect(deployer).deploy();

        // Deploying and Setting up the event Contract
        const eventFactory = await ethers.getContractFactory("Event");
        const eventContract = await eventFactory
            .connect(deployer)
            .deploy(deployer.address, eventData.uri, eventData.details._name, eventData.ticketBase, [], [], [], []);

        console.log("Event Contract Address is : ", eventContract.address);

        priceData.priceBase[0].currencyAddress = erc20Contract.address;
        priceData.priceBase[1].currencyAddress = erc20Contract1.address;

        const tx = await eventContract.registerCurrency(priceData.priceBase);
        tx.wait();
        // Setting up the Erc20 Contract so that event can read encrypted Balance
        const tx1 =await erc20Contract.setBalanceReader(eventContract.address);
        tx1.wait();

        return { instance, erc20Contract, eventContract, erc20Contract1, deployer, tester }
    }

    it("should mint and approve the ERC20 Tokens", async () => {
        const { instance, erc20Contract, eventContract, erc20Contract1, deployer, tester } = await deploymentFixture();


        // ERC20 Contract tests for Mint and Approve
        const encryptedMintingAmount = instance.encrypt32(1000);
        const hexString = "0x" + toHexString(encryptedMintingAmount);
        await erc20Contract.mint(hexString);
        await erc20Contract.approve(eventContract.address, hexString);
    });

    it("Owner Role Checker", async () => {
        const { instance, erc20Contract, eventContract, erc20Contract1, deployer, tester } = await deploymentFixture();
        // Owner Setup Tests
        const OWNER_ROLE = await eventContract.OWNER_ROLE();
        expect(await eventContract.hasRole(OWNER_ROLE, deployer.address)).to.equal(true);
    });


    it("Ticket Purchased  Checker", async () => {
        const { instance, erc20Contract, eventContract, erc20Contract1, deployer, tester } = await deploymentFixture();

        // Ticket Setup tests
        // Token Purchased should be Zero
        expect((await eventContract.tokensPurchased("free")).toNumber()).to.equal(0);
        expect((await eventContract.tokensPurchased("vip")).toNumber()).to.equal(0);
        // Amount of tickets available for each type is set.
        expect((await eventContract.tokenAmounts("free")).toNumber()).to.equal(eventData.amounts[0]);
        expect((await eventContract.tokenAmounts("vip")).toNumber()).to.equal(eventData.amounts[1]);
        // Latest tokens are set up with proper ids
        expect(await eventContract.tokenIdCounter()).to.equal(0);
        expect(await eventContract.tokenIdCounter()).to.equal(0);

    });

    it("Should not allow us to buy when not active", async function () {
        const { instance, erc20Contract, eventContract, erc20Contract1, deployer, tester } = await deploymentFixture();

        // Set inactive, fail to buy ticket
        console.log("1");
        const tx = await eventContract.setActive(false);
        await tx.wait()
        console.log("2");
        await expect(
            eventContract["buyToken(string,uint256,address,string)"](
                "free",
                1,
                deployer.address,
                "native"
            )
        ).to.be.revertedWith("Not active");
        expect((await eventContract.tokensPurchased("free")).toNumber()).to.equal(0);
    });

    it("Should let us buy tickets when Active", async function () {
        const { instance, erc20Contract, eventContract, erc20Contract1, deployer, tester } = await deploymentFixture();

        await eventContract.setActive(true);
        await expect(eventContract["buyToken(string,uint256,address,string)"](
          "free",
          1,
          deployer.address,
          "native"
        )).to.emit(eventContract,"TokenPurchased");

    });
})
