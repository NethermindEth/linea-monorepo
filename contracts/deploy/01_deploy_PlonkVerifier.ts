import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployFromFactory } from "../scripts/hardhat/utils";
import {
  tryVerifyContract,
  getDeployedContractAddress,
  tryStoreAddress,
  validateDeployBranchAndTags,
  getRequiredEnvVar,
} from "../common/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  validateDeployBranchAndTags(hre.network.name);

  const contractName = getRequiredEnvVar("PLONKVERIFIER_NAME");
  const existingContractAddress = await getDeployedContractAddress(contractName, deployments);

  const provider = ethers.provider;

  if (existingContractAddress === undefined) {
    console.log(`Deploying initial version, NB: the address will be saved if env SAVE_ADDRESS=true.`);
  } else {
    console.log(`Deploying new version, NB: ${existingContractAddress} will be overwritten if env SAVE_ADDRESS=true.`);
  }
  const contract = await deployFromFactory(contractName, provider);
  const contractAddress = await contract.getAddress();
  console.log(`${contractName} deployed at ${contractAddress}`);

  process.env.PLONKVERIFIER_ADDRESS = contractAddress;

  const deployTx = contract.deploymentTransaction();
  if (!deployTx) {
    throw "Deployment transaction not found.";
  }

  await tryStoreAddress(hre.network.name, contractName, contractAddress, deployTx.hash);

  await tryVerifyContract(contractAddress);
};
export default func;
func.tags = ["PlonkVerifier"];
