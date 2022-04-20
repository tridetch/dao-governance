import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { Dao } from "../typechain";

describe("Dao governance", function () {
    let clean: any;

    let daoContract: Dao;

    let chairperson: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress;

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const TOTAL_SUPPLY = parseUnits("100000");
    const DEFAULT_QUORUM_PERCENT = BigNumber.from(75);
    const DEFAULT_QUORUM_VOTES_AMOUNT: BigNumber = calculateQuorum(DEFAULT_QUORUM_PERCENT, TOTAL_SUPPLY);
    const DEFAULT_DEBATING_PERIOD = BigNumber.from(60 * 60 * 24); // One day

    before(async () => {
        [chairperson, user1, user2] = await ethers.getSigners();

        const DaoFactory = await ethers.getContractFactory("Dao");

        daoContract = await DaoFactory.deploy(DEFAULT_QUORUM_PERCENT, DEFAULT_DEBATING_PERIOD, TOTAL_SUPPLY);
        await daoContract.deployed();

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
            it("Should change quorum", async () => {
                const newQuorum = BigNumber.from("25");
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
                await expect(daoContract.setQuorum(BigNumber.from(101))).to.be.reverted;
            });
        });
        describe("#setDebatingDuration()", function () {
            it("Should change duration", async () => {
                assert(false);
            });
            it("Only chairperson", async () => {
                assert(false);
            });
        });
    });

    describe("Depositing", function () {
        describe("#deposit()", async () => {
            it("Should accept deposit", async function () {
                // write user share of governance
                // increase amount of staked tokens
                // emit event
                assert(false);
            });
        });

        describe("#withdraw()", function () {
            it("Should fail if tokens locked in ongoing governance", async () => {
                assert(false);
            });
            it("Should withdrow tokens", async () => {
                //emit withdraw
                //check that balance decreased
                assert(false);
            });
        });
    });

    describe("Voting", function () {
        describe("#addProposal()", function () {
            it("Should fail if not a chairman", async () => {
                assert(false);
            });
            it("Should begin voting for this proposal", async () => {
                //emit event
                //proposal added to mapping
                //id increased
                assert(false);
            });
        });
        describe("#vote()", function () {
            it("Should fail if no such proposal", async () => {
                assert(false);
            });
            it("Should fail if already voted", async () => {
                assert(false);
            });
            it("Should fail if debatingPeriod over", async () => {
                assert(false);
            });
            it("Should count user vote", async () => {
                ///add voter to list
                ///vote for, vote against
                assert(false);
            });
            it("Should be able to vote on all ongoing proposals", async () => {
                ///add voter to list
                assert(false);
            });
        });
        describe("#finishProposal()", function () {
            it("Should fail if already executed", async () => {
                assert(false);
            });
            it("Should fail if no such proposal", async () => {
                assert(false);
            });
            it("Should fail if debating in progress", async () => {
                assert(false);
            });
            it("Should be finished with quorum failed event", async () => {
                assert(false);
            });
            it("Should be finished with rejected event", async () => {
                assert(false);
            });
            it("Should be finished with accepted event, and execute instruction", async () => {
                assert(false);
            });
        });
    });
});
