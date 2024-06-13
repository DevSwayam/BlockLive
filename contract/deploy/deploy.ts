import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  
  console.log("Deployer:", deployer);

  const deployedEvent = await deploy("Event", {
    from: deployer,
    args: [
      deployer,
      "https://blocklive.io/metadata/collection",
      "ATX DAO Native 8/8/22",
      [],
      [],
      [],
      [],
      []
    ],
    log: true,
  });

  const deployedEncryptedERC20 = await deploy("EncryptedERC20", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  console.log(`Event contract deployed at: ${deployedEvent.address}`);
  console.log(`Encrypted ERC20 Contract deployed at: ${deployedEncryptedERC20.address}`);
};

export default func;

func.id = "deploy_encryptedERC20"; // id required to prevent reexecution
func.tags = ["EncryptedERC20"];
