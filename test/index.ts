import { assert, expect } from "chai";
import { ethers } from "hardhat";

describe("Dao governance", function () {
    describe("Deploy", function () {
        it("Should setup initial parameters correctly", async () => {
            // minimumQuorum;
            // debatingPeriodDuration;
            // chairperson;
            assert(true);
        });
    });

    describe("Depositing", function () {
        describe("#deposit()", async () => {
            it("Should accept deposit", async function () {
                // write balance of user
                // emit event
            });
        });

        describe("#withdraw()", function(){
          it("Should revert if tokens locked in governance",async () => {
            
          });

        })
    });
});
