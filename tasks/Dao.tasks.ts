import { parseUnits } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const contractInfo = require("./DeployedContracts.json");

function fetchContract(hre: HardhatRuntimeEnvironment) {
    return hre.ethers.getContractAt("Dao", contractInfo.daoAddress);
}

task("daoDeposit", "Deposit DAO tokens")
    .addParam("amount", "Amount of tokens to deposit")
    .setAction(async (taskArgs, hre) => {
        let amount = parseUnits(taskArgs.amount);
        let daoContract = await fetchContract(hre);
        const tx = await daoContract.deposit(amount);
        console.log("Transaction minted: ", tx);
    });

task("daoWithdraw", "Withdraw DAO tokens").setAction(async (taskArgs, hre) => {
    let daoContract = await fetchContract(hre);
    const tx = await daoContract.withdraw();
    console.log("Transaction minted: ", tx);
});

task("daoAddProposal", "Create new proposal")
    .addParam("calldata", "Instruction to execute")
    .addParam("recipient", "Recipient address")
    .addParam("description", "Text description of proposal")
    .setAction(async (taskArgs, hre) => {
        let daoContract = await fetchContract(hre);
        const tx = await daoContract.addProposal(taskArgs.calldata, taskArgs.recipient, taskArgs.description);
        console.log("Transaction minted: ", tx);
    });

task("daoVote", "Vote on proposal")
    .addParam("proposalid", "Id of proposal")
    .addParam("decision", "Vote for or against proposal")
    .setAction(async (taskArgs, hre) => {
        let daoContract = await fetchContract(hre);
        const tx = await daoContract.vote(taskArgs.proposalid, taskArgs.decision);
        console.log("Transaction minted: ", tx);
    });

task("daoFinishProposal", "Finish proposal")
    .addParam("proposalid", "Id of proposal")
    .setAction(async (taskArgs, hre) => {
        let daoContract = await fetchContract(hre);
        const tx = await daoContract.finishProposal(taskArgs.proposalid);
        console.log("Transaction minted: ", tx);
    });
