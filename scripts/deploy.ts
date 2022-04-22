import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    const quorum = 75;
    const debatingPeriod = 60 * 60 * 24;
    const supply = parseUnits("100000");

    const DaoFactory = await ethers.getContractFactory("Dao");
    const dao = await DaoFactory.deploy(quorum, debatingPeriod, supply);
    await dao.deployed();

    const SecretFactory = await ethers.getContractFactory("SecretContract");
    const secretContract = await SecretFactory.deploy();
    await secretContract.deployed();

    const contract = {
        daoAddress: dao.address,
        secretContractAddress: secretContract.address,
        deployer: (await ethers.getSigners())[0].address
    };

    const filePath = "./tasks/DeployedContracts.json";

    fs.writeFile(filePath, JSON.stringify(contract), (err) => {
        console.log(err);
        if (err) throw err;
    });

    console.log("Contracts deployed", contract);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
