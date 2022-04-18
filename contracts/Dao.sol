//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Dao is ERC20, AccessControl {
    ///@dev Emitted when user deposit tokens in DAO
    ///@param from user address
    ///@param amount amount of deposited tokens
    event Deposit(address indexed from, uint256 amount);

    ///@dev Emitted when user withdraw tokens from DAO
    ///@param to user address
    ///@param amount amount of tokens
    event Withdraw(address indexed to, uint256 amount);

    event NewProposal(
        uint256 indexed id,
        address indexed recipient,
        string description,
        uint256 endTime,
        uint256 minimumQuorum
    );

    ///@dev Unable to withdraw while there is a vote in which the user participated
    error VotingInProgress();

    ///@dev Share in the DAO
    struct Share {
        uint256 amount;
        uint256 lockedUntil; /// Timestamp of last voting, where user participate, will be ended
    }

    ///@dev Information about proposal
    struct Proposal {
        bytes instruction;
        address recipient;
        string description;
        uint256 endTime;
        uint256 minimumQuorum;
        mapping(address => bool) voters; /// Who already voted
        uint256 voteFor; /// Total positive votes
        uint256 voteAgainst; /// Total negative votes
        bool executed;
    }

    /// Person who is allowed to create new proposals
    address public chairperson;
    bytes32 public constant CHAIRPERSON_ROLE = keccak256("CHAIRPERSON_ROLE");

    ///@dev Proposal id
    uint256 public proposalId;

    ///@dev User deposits for participating in voting
    mapping(address => Share) public shares;

    ///@dev Proposal id to proposal info
    mapping(uint256 => Proposal) public proposals;

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

    ///@dev Deposit funds in DAO for voting
    ///@param amount Amount of tokens to deposit
    function deposit(uint256 amount) external {
        transferFrom(msg.sender, address(this), amount);

        Share memory share = shares[msg.sender];
        share.amount += amount;
        shares[msg.sender] = share;

        emit Deposit(msg.sender, amount);
    }

    ///@dev Withdraw tokens
    function withdraw() external {
        Share memory share = shares[msg.sender];
        if (share.lockedUntil > block.timestamp) revert VotingInProgress();

        transfer(msg.sender, share.amount);
        emit Withdraw(msg.sender, share.amount);

        share.amount = 0;
        shares[msg.sender] = share;
    }

    ///@dev Create new proposal
    ///@param instruction instruction to execute if proposal will be accepted
    ///@param recipient target address
    ///@param description description of proposal
    function addProposal(
        bytes calldata instruction,
        address recipient,
        string memory description
    ) external onlyRole(CHAIRPERSON_ROLE) {
        Proposal storage proposal = proposals[proposalId];

        proposal.instruction = instruction;
        proposal.recipient = recipient;
        proposal.description = description;
        proposal.endTime = block.timestamp + debatingPeriodDuration;
        proposal.minimumQuorum = minimumQuorum;

        emit NewProposal(proposalId, recipient, description, block.timestamp + debatingPeriodDuration, minimumQuorum);
        proposalId++;
    }
}
