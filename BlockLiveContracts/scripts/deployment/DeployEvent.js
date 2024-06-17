const {ethers} = require("hardhat")
const {eventData,priceData} = require("../sampleData/data_paidSingle");


async function deployEvent() {

    const accounts = await ethers.getSigners();
    const deployer = accounts[0];

    let eventContract;

    const eventFactory = await ethers.getContractFactory("Event");
    eventContract = await eventFactory.connect(deployer).deploy(deployer.address, eventData.uri, eventData.details._name, [], [], [], [], []);

    return eventContract;

}
module.exports = {
    deployEvent,
}