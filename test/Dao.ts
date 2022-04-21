import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { beforeEach } from "mocha";
import { Dao, SecretContract } from "../typechain";

describe("Dao governance", function () {
    let clean: any;

    let daoContract: Dao;
    let secretContract: SecretContract;

    let chairperson: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

    const TOTAL_SUPPLY = parseUnits("100000");
    const DEFAULT_QUORUM_PERCENT = BigNumber.from(75);
    const DEFAULT_QUORUM_VOTES_AMOUNT: BigNumber = calculateQuorum(DEFAULT_QUORUM_PERCENT, TOTAL_SUPPLY);
    const DEFAULT_DEBATING_PERIOD = BigNumber.from(60 * 60 * 24); // One day
    const PROPOSAL_DESCRIPTION = "Invest treasure funds";
    let proposalCallData: string;

    before(async () => {
        [chairperson, user1, user2] = await ethers.getSigners();

        const DaoFactory = await ethers.getContractFactory("Dao");
        daoContract = await DaoFactory.deploy(DEFAULT_QUORUM_PERCENT, DEFAULT_DEBATING_PERIOD, TOTAL_SUPPLY);
        await daoContract.deployed();

        const SecretFactory = await ethers.getContractFactory("SecretContract");
        secretContract = await SecretFactory.deploy();
        await secretContract.deployed();

        proposalCallData = secretContract.interface.encodeFunctionData("makeDaoMembersRich", [true]);

        clean = await network.provider.send("evm_snapshot");
    });

    afterEach(async () => {
        await network.provider.send("evm_revert", [clean]);
        clean = await network.provider.send("evm_snapshot");
    });

    function calculateQuorum(quorumPercent: BigNumber, tokenSupply: BigNumber): BigNumber {
        let zero = BigNumber.from("0");
        if (quorumPercent.eq(zero)) {
            return zero;
        } else {
            return tokenSupply.mul(quorumPercent).div(100);
        }
    }

    async function networkWait(seconds: number) {
        await network.provider.send("evm_increaseTime", [seconds]);
        await network.provider.send("evm_mine", []);
    }

    describe("Deploy and common methods", function () {
        describe("#constructor()", function () {
            it("Should setup initial parameters correctly", async () => {
                expect(await daoContract.debatingPeriodDuration()).to.be.equal(DEFAULT_DEBATING_PERIOD);
                expect(await daoContract.chairperson()).to.be.equal(chairperson.address);
                expect(await daoContract.chairperson()).to.be.equal(chairperson.address);
                expect(await daoContract.minimumQuorum()).to.be.equal(
                    calculateQuorum(DEFAULT_QUORUM_PERCENT, TOTAL_SUPPLY)
                );
            });
        });
        describe("#setQuorum()", function () {
            const newQuorum = BigNumber.from("25");
            it("Should change quorum", async () => {
                await daoContract.setQuorum(newQuorum);
                expect(await daoContract.minimumQuorum()).to.be.equal(
                    calculateQuorum(newQuorum, TOTAL_SUPPLY)
                );
            });
            it("Should fail if parameter 'quorumPercent' not in range 0 - 100 percents", async () => {
                await expect(daoContract.setQuorum(BigNumber.from(101))).to.be.revertedWith(
                    "IncorrectQuorumParameter"
                );
            });
            it("Only chairperson", async () => {
                await expect(daoContract.connect(user1).setQuorum(newQuorum)).to.be.reverted;
            });
        });
        describe("#setDebatingDuration()", function () {
            const newDuration = BigNumber.from(60 * 60 * 24 * 2); // 2 days
            it("Should change duration", async () => {
                await daoContract.setDebatingDuration(newDuration);
                expect(await daoContract.debatingPeriodDuration()).to.be.equal(newDuration);
            });
            it("Only chairperson", async () => {
                await expect(daoContract.connect(user1).setDebatingDuration(newDuration)).to.be.reverted;
            });
        });
    });

    describe("Depositing", function () {
        const depositAmount = parseUnits("1000");
        describe("#deposit()", async () => {
            it("Should accept deposit", async function () {
                await expect(daoContract.deposit(depositAmount))
                    .to.emit(daoContract, "Deposit")
                    .withArgs(chairperson.address, depositAmount);
                expect(await daoContract.balanceOf(chairperson.address)).to.be.equal(
                    TOTAL_SUPPLY.sub(depositAmount)
                );
                expect((await daoContract.shares(chairperson.address)).amount).to.be.equal(depositAmount);
            });
        });

        describe("#withdraw()", function () {
            it("Should withdrow tokens", async () => {
                await daoContract.deposit(depositAmount);
                await expect(daoContract.withdraw())
                    .to.emit(daoContract, "Withdraw")
                    .withArgs(chairperson.address, depositAmount);
                expect((await daoContract.shares(chairperson.address)).amount).to.be.equal(0);
                expect(await daoContract.balanceOf(chairperson.address)).to.be.equal(TOTAL_SUPPLY);
            });
            it("Should fail if tokens locked in ongoing governance", async () => {
                await daoContract.deposit(depositAmount);
                await daoContract.addProposal(
                    proposalCallData,
                    secretContract.address,
                    "Invest treasure funds"
                );
                await daoContract.vote(0, true);
                await expect(daoContract.withdraw()).to.be.revertedWith("VotingInProgress");
            });
        });
    });

    describe("Voting", function () {
        describe("#addProposal()", function () {
            it("Should fail if not a chairman", async () => {
                await expect(
                    daoContract
                        .connect(user1)
                        .addProposal(proposalCallData, secretContract.address, PROPOSAL_DESCRIPTION)
                ).to.be.reverted;
            });
            it("Should begin voting for this proposal", async () => {
                await expect(
                    daoContract.addProposal(proposalCallData, secretContract.address, PROPOSAL_DESCRIPTION)
                )
                    .to.emit(daoContract, "NewProposal")
                    .withArgs(
                        0,
                        secretContract.address,
                        PROPOSAL_DESCRIPTION,
                        DEFAULT_DEBATING_PERIOD,
                        DEFAULT_QUORUM_VOTES_AMOUNT
                    );

                const proposal = await daoContract.proposals(0);
                expect(proposal.recipient).to.be.equal(secretContract.address);
                expect(proposal.minimumQuorum).to.be.equal(DEFAULT_QUORUM_VOTES_AMOUNT);
                expect(proposal.minimumQuorum).to.be.equal(DEFAULT_QUORUM_VOTES_AMOUNT);
                expect(proposal.instruction).to.be.equal(proposalCallData);
                expect(await daoContract.nextProposalId()).to.be.equal(1);
            });
        });
        describe("#vote()", function () {
            const depositAmount = parseUnits("1000");
            const PROPOSAL_ID = 0;
            const FOR = true;
            const AGAINST = false;

            beforeEach(async () => {
                await daoContract.deposit(depositAmount);
                await daoContract.addProposal(proposalCallData, secretContract.address, PROPOSAL_DESCRIPTION);
            });

            it("Should fail if no such proposal", async () => {
                await expect(daoContract.vote(1, FOR)).to.be.revertedWith("ProposalDoNotExist");
            });
            it("Should fail if already voted", async () => {
                await daoContract.vote(PROPOSAL_ID, FOR);
                await expect(daoContract.vote(PROPOSAL_ID, AGAINST)).to.be.revertedWith("AlreadyVoted");
            });
            it("Should fail if debatingPeriod over", async () => {
                await networkWait(DEFAULT_DEBATING_PERIOD.toNumber());
                await expect(daoContract.vote(PROPOSAL_ID, FOR)).to.be.revertedWith("VotePeriodIsOver");
            });
            it("Should vote successful", async () => {
                await expect(daoContract.vote(PROPOSAL_ID, FOR))
                    .to.emit(daoContract, "Vote")
                    .withArgs(PROPOSAL_ID, chairperson.address, FOR, depositAmount);
            });
            it("Should be able to vote on all ongoing proposals", async () => {
                await daoContract.addProposal(proposalCallData, secretContract.address, "One more proposal");

                await daoContract.vote(PROPOSAL_ID, FOR);
                await expect(daoContract.vote(1, AGAINST)).to.be.not.reverted;
            });
        });
        describe("#finishProposal()", function () {
            const depositAmount = parseUnits("1000");
            const depositQuorumAmount = parseUnits("75000");
            const PROPOSAL_ID = 0;
            const FOR = true;
            const AGAINST = false;

            beforeEach(async () => {
                await daoContract.deposit(depositAmount);
                await daoContract.addProposal(proposalCallData, secretContract.address, PROPOSAL_DESCRIPTION);
            });

            it("Should fail if no such proposal", async () => {
                await expect(daoContract.finishProposal("69")).to.be.revertedWith("ProposalDoNotExist");
            });
            it("Should fail if debating in progress", async () => {
                console.log(await daoContract.proposals(0));
                // await expect(daoContract.finishProposal(PROPOSAL_ID)).to.be.revertedWith(
                //     "DebatingPeriodNotOver"
                // );
            });
            it("Should be finished with quorum failed event", async () => {
                // await networkWait(DEFAULT_DEBATING_PERIOD.toNumber());
                // await expect(daoContract.finishProposal(PROPOSAL_ID))
                //     .to.emit(daoContract, "ProposalFinished")
                //     .withArgs(PROPOSAL_ID, "QuorumNotPass");
                assert(false);
            });
            it("Should be finished with rejected event", async () => {
                // await daoContract.deposit(depositQuorumAmount);
                // await networkWait(DEFAULT_DEBATING_PERIOD.toNumber());
                // await expect(daoContract.finishProposal(PROPOSAL_ID)).to.be.revertedWith(
                //     "DebatingPeriodNotOver"
                // );
                assert(false);
            });
            it("Should be finished with accepted event, and execute instruction", async () => {
                assert(false);
            });
            it("Should fail if already executed", async () => {
                assert(false);
            });
        });
    });
});
