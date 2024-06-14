const { ethers, network, run } = require("hardhat")

async function deployEvent() {
    const eventUriBase = "https://example.com/api/tickets";
    const eventName = "SampleEvent";

    const accounts = await ethers.getSigners();
    const deployer = accounts[0];

    let eventContract;

    const eventFactory = await ethers.getContractFactory("Event");
    eventContract = await eventFactory.connect(deployer).deploy(deployer.address, eventUriBase, eventName, [], [], [], [], []);
    return eventContract.address;

}
module.exports = {
    deployEvent,
}