//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Dao is ERC20, AccessControl {
    event Deposit(address from, uint256 amount);

    /// Person who is allowed to create new proposals
    address public chairperson;
    bytes32 public constant CHAIRPERSON_ROLE = keccak256("CHAIRPERSON_ROLE");

    /// User deposits for participating in voting
    /// AddressToBalance
    mapping(address => uint256) public deposits;

    /// The number of votes required for a vote to be considered valid
    uint256 public minimumQuorum;
    /// Period of voting
    uint256 public debatingPeriodDuration;

    constructor(uint256 minimumQuorum_, uint256 debatingPeriodDuration_) ERC20("Governance", "GovToken") {
        minimumQuorum = minimumQuorum_;
        debatingPeriodDuration = debatingPeriodDuration_;
        chairperson = msg.sender;
        _grantRole(CHAIRPERSON_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @dev Deposit funds in DAO for voting
    /// @param amount Amount of tokens to deposit
    function deposit(uint256 amount) external {
        transfer(msg.sender, amount);
        deposits[msg.sender] = amount;
        emit Deposit(msg.sender, amount);
    }

    function addProposal(
        bytes calldata,
        address recipient,
        string memory description
    ) external onlyRole(CHAIRPERSON_ROLE) {
        
    }
}
