//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

///@dev Unable to withdraw while there is a vote in which the user participated
error VotingInProgress();
///@dev User already voted on this proposal
error AlreadyVoted();
///@dev Incorrect quorum percent. Must be in range 0-100
error IncorrectQuorumParameter();
///@dev User try to vote on proposal where debating perioud is over
error VotePeriodIsOver();
///@dev Proposal with such id do not exist
error ProposalDoNotExist();
///@dev This proposal already has been executed
error ProposalAlreadyExecuted();
///@dev Debating period for this proposal not over
error DebatingPeriodNotOver();

contract Dao is ERC20, AccessControl {
    ///@dev Emitted when user deposit tokens in DAO
    ///@param from user address
    ///@param amount amount of deposited tokens
    event Deposit(address indexed from, uint256 amount);

    ///@dev Emitted when user withdraw tokens from DAO
    ///@param to user address
    ///@param amount amount of tokens
    event Withdraw(address indexed to, uint256 amount);

    ///@dev Emitted when new proposal created
    ///@param id id of proposal
    ///@param recipient address to which the call of instruction will be made
    ///@param description text description of proposal
    ///@param endTime deadline for voting
    ///@param minimumQuorum minimum percent of votes that must participate in voting
    event NewProposal(
        uint256 indexed id,
        address indexed recipient,
        string description,
        uint256 endTime,
        uint256 minimumQuorum
    );

    ///@dev Emitted when new vote made for proposal
    ///@param account address of voted account
    ///@param decision is user vote for of against the proposal
    ///@param votingPower amount of tokens that user deposit in dao
    event Vote(
        uint256 indexed proposalId,
        address indexed account,
        bool indexed decision,
        uint256 votingPower
    );

    ///@dev Emitted when proposal finished
    ///@param proposalId id of proposal
    ///@param result result of proposal voting and executing
    event ProposalFinished(uint256 indexed proposalId, ProposalResult indexed result);

    ///@dev Struct that contin information about user share of DAO
    ///@param amount amount of tokens staked by user
    ///@param lockedUntil Timestamp of last voting, where user participate, will be ended
    struct Share {
        uint256 amount;
        uint256 lockedUntil;
    }

    /**
        @dev This struct contain information about proposal
        @param instruction instruction that will be executed if proposal pass
        @param recepient target address for instruction
        @param description text description of proposal
        @param endTime deadline for voting
        @param minimumQuorum minimum number of votes for a vote to be considered successful
        @param voter addresses that have already voted
        @param votesFor total votes that support proposal
        @param votesAgainst total votes that against proposal
        @param isFinished true if finish already called for proposal, false othervise
    */
    struct Proposal {
        bytes instruction;
        address recipient;
        string description;
        uint256 endTime;
        uint256 minimumQuorum;
        mapping(address => bool) voters;
        uint256 votesFor;
        uint256 votesAgainst;
        bool isFinished;
    }

    ///@dev Status of proposal
    enum ProposalResult {
        QuorumNotPass,
        Rejected,
        Executed,
        ExecutedWithError
    }

    /// Person who is allowed to create new proposals
    address public chairperson;
    bytes32 public constant CHAIRPERSON_ROLE = keccak256("CHAIRPERSON_ROLE");

    ///@dev Proposal id
    uint256 public nextProposalId;

    ///@dev User deposits for participating in voting
    mapping(address => Share) public shares;

    ///@dev Proposal id to proposal info
    mapping(uint256 => Proposal) public proposals;

    /// Number of votes required for a proposal to be considered valid
    uint256 public minimumQuorum;
    /// Period of voting
    uint256 public debatingPeriodDuration;

    ///@dev constructor for contract
    ///@param minimumQuorumPercent_ percent of voters that must particiate in voting
    ///@param debatingPeriodDuration_ period of voting
    ///@param daoTokenSupply_ total supply of dao tokens
    constructor(
        uint256 minimumQuorumPercent_,
        uint256 debatingPeriodDuration_,
        uint256 daoTokenSupply_
    ) ERC20("Governance", "GovToken") {
        minimumQuorum = calculateQuorumAmount(minimumQuorumPercent_, daoTokenSupply_);
        debatingPeriodDuration = debatingPeriodDuration_;
        chairperson = msg.sender;
        _grantRole(CHAIRPERSON_ROLE, msg.sender);
        _mint(msg.sender, daoTokenSupply_);
    }

    ///@dev Calculate quorum votes amount from total supply and percent
    ///@param quorumPercent percent of votes that must vote on proposal
    ///@param tokenSupply total token supply
    function calculateQuorumAmount(uint256 quorumPercent, uint256 tokenSupply)
        private
        pure
        returns (uint256 quorum)
    {
        if (quorumPercent > 100) revert IncorrectQuorumParameter();
        if (quorumPercent == 0) {
            quorum = 0;
        } else {
            quorum = ((tokenSupply * quorumPercent) / 100);
        }
    }

    ///@dev Set new quorum percent
    ///@param quorumPercent quorum in percents
    function setQuorum(uint256 quorumPercent) external onlyRole(CHAIRPERSON_ROLE) {
        minimumQuorum = calculateQuorumAmount(quorumPercent, totalSupply());
    }

    function setDebatingDuration(uint256 duration) external onlyRole(CHAIRPERSON_ROLE) {
        debatingPeriodDuration = duration;
    }

    ///@dev Deposit funds in DAO for voting
    ///@param amount Amount of tokens to deposit
    function deposit(uint256 amount) external {
        _transfer(msg.sender, address(this), amount);

        Share memory share = shares[msg.sender];
        share.amount += amount;
        shares[msg.sender] = share;

        emit Deposit(msg.sender, amount);
    }

    ///@dev Withdraw tokens
    function withdraw() external {
        Share memory share = shares[msg.sender];
        if (share.lockedUntil > block.timestamp) revert VotingInProgress();

        _transfer(address(this), msg.sender, share.amount);
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
        Proposal storage proposal = proposals[nextProposalId];
        proposal.instruction = instruction;
        proposal.recipient = recipient;
        proposal.description = description;
        proposal.endTime = block.timestamp + debatingPeriodDuration;
        proposal.minimumQuorum = minimumQuorum;

        emit NewProposal(nextProposalId, recipient, description, debatingPeriodDuration, minimumQuorum);

        nextProposalId++;
    }

    ///@dev Check wether proposal with such id exist or not
    ///@param proposalId id of proposal to be verified
    ///@return true if proposal exist, false othervise
    function isProposalNotExist(uint256 proposalId) private view returns (bool) {
        return proposalId >= nextProposalId;
    }

    ///@dev Vote on proposal
    ///@param proposalId id of proposal in with user wants participate
    ///@param decision user decision, true if accepted by user, false otherwise
    function vote(uint256 proposalId, bool decision) external {
        if (isProposalNotExist(proposalId)) revert ProposalDoNotExist();
        Proposal storage proposal = proposals[proposalId];
        uint deadline = proposal.endTime;
        if (proposal.voters[msg.sender]) revert AlreadyVoted();
        if (deadline < block.timestamp) revert VotePeriodIsOver();

        Share memory share = shares[msg.sender];
        if (decision) {
            proposal.votesFor += share.amount;
        } else {
            proposal.votesAgainst += share.amount;
        }

        if (deadline > share.lockedUntil) shares[msg.sender].lockedUntil = deadline;
        proposal.voters[msg.sender] = true;

        emit Vote(proposalId, msg.sender, decision, share.amount);
    }

    ///@dev Finish proposal
    ///@param proposalId id of proposal
    function finishProposal(uint256 proposalId) external {
        if (isProposalNotExist(proposalId)) revert ProposalDoNotExist();
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp < proposal.endTime) revert DebatingPeriodNotOver();
        if (proposal.isFinished) revert ProposalAlreadyExecuted();

        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;

        if (totalVotes < proposal.minimumQuorum) {
            emit ProposalFinished(proposalId, ProposalResult.QuorumNotPass);
        } else if (proposal.votesAgainst >= proposal.votesFor) {
            emit ProposalFinished(proposalId, ProposalResult.Rejected);
        } else {
            executeProposal(proposalId, proposal.instruction, proposal.recipient);
        }
        proposal.isFinished = true;
    }

    function executeProposal(
        uint256 proposalId,
        bytes memory instruction,
        address recipient
    ) private {
        (bool success, ) = recipient.call(instruction);
        if (success) {
            emit ProposalFinished(proposalId, ProposalResult.Executed);
        } else {
            emit ProposalFinished(proposalId, ProposalResult.ExecutedWithError);
        }
    }
}
