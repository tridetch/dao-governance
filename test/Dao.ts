import { assert, expect } from "chai";
import { ethers } from "hardhat";

describe("Dao governance", function () {
    describe("Deploy", function () {
        it("Should setup initial parameters correctly", async () => {
            // minimumQuorum;
            // debatingPeriodDuration;
            // chairperson;
            assert(false);
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
    });
});
