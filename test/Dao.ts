import { assert, expect } from "chai";
import { ethers } from "hardhat";

describe("Dao governance", function () {
    describe("Deploy and common methods", function () {
        describe("#constructor()", function () {
            it("Should setup initial parameters correctly", async () => {
                // minimumQuorum;
                // debatingPeriodDuration;
                // chairperson;
                // calculate correct quorum
                assert(false);
            });
            it("Should fail if parameter 'quorumPercent' not in range 0 - 100 percents", async () => {
                assert(false);
            });
        });
        describe("#setQuorum()", function () {
            it("Should change quorum", async () => {
                assert(false);
            });
            it("Should fail if parameter 'quorumPercent' not in range 0 - 100 percents", async () => {
                assert(false);
            });
            it("Only chairperson", async () => {
                assert(false);
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
