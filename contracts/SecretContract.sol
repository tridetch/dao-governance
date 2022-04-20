//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract SecretContract {
    event Rekted(address who, string message);

    function makeDaoMembersRich() public {
        emit Rekted(msg.sender, "You are REKTED, LOL");
    }
}
