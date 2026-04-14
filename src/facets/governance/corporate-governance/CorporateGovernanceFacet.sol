// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CorporateGovernanceStorage} from "./storage/CorporateGovernanceStorage.sol";
import {AppStorage} from "src/libraries/AppStorage.sol";

contract CorporateGovernanceFacet {
function gs() internal pure returns (CorporateGovernanceStorage.Layout storage) {
    return CorporateGovernanceStorage.layout();
}

    // EVENTS
    event ChairpersonSet(address chairperson);
    event SecretarySet(address secretary);
    event BoardMemberAdded(address member);
    event SessionOpened(string name);
    event ResolutionCreated(uint256 id, string description);
    event Voted(address voter, uint256 resolutionId, bool support);
    event ResolutionClosed(uint256 id, bool approved, uint256 yesVotes, uint256 noVotes);
    event ResolutionVerified(uint256 id, address verifier);

    // MODIFIERS
modifier onlyChair() {
    _onlyChair();
    _;
}

function _onlyChair() internal view {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(msg.sender == ds.chairperson, "Not chairperson");
}

modifier onlyBoard() {
    _onlyBoard();
    _;
}

function _onlyBoard() internal view {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(ds.boardMembers[msg.sender], "Not board member");
}

modifier onlyVerifier() {
    _onlyVerifier();
    _;
}

function _onlyVerifier() internal view {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(
        msg.sender == ds.chairperson || msg.sender == ds.secretary,
        "Not verifier"
    );
}

    // 🔥 INIT (CRITICAL FOR DIAMOND STORAGE)
function initDao() external {
	require(msg.sender == AppStorage.layout().owner, "Not owner");

    CorporateGovernanceStorage.Layout storage ds =
        CorporateGovernanceStorage.layout();

    require(!ds.initialized, "Already initialized");

    ds.initialized = true;
    ds.sessionActive = false;

    ds.nudosToken = 0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C;
    ds.quorumPercentage = 40;
}

    // GOVERNANCE SETUP
function setChairperson(address _chair) external {

	require(msg.sender == AppStorage.layout().owner, "Not owner");

    require(_chair != address(0), "Invalid chairperson");

    CorporateGovernanceStorage.Layout storage ds =
        CorporateGovernanceStorage.layout();

    ds.chairperson = _chair;

    emit ChairpersonSet(_chair);
}

function setSecretary(address _secretary) external onlyChair {
	require(_secretary != address(0), "Invalid secretary");
	    CorporateGovernanceStorage.layout().secretary = _secretary;
    emit SecretarySet(_secretary);
}

function addBoardMember(address member) external onlyChair {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();

    require(member != address(0), "Invalid member");
    require(!ds.boardMembers[member], "Already board member");

    ds.boardMembers[member] = true;
    ds.boardMemberCount++;

    emit BoardMemberAdded(member);
}

    // SESSION MANAGEMENT
function openSession(string calldata name) external onlyChair {
        CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
        require(!ds.sessionActive, "Session already active");

        ds.sessionActive = true;
        emit SessionOpened(name);
    }

    // RESOLUTIONS
function createResolution(
    string calldata description,
    address responsible
) external onlyBoard {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(ds.sessionActive, "Session not active");

    uint256 id = ds.resolutionCount;

    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[id];

    r.description = description;
    r.responsible = responsible;

    // 🔹 Estado inicial: solo lectura
    r.status = CorporateGovernanceStorage.ResolutionStatus.Created;

    ds.resolutionCount++;

    emit ResolutionCreated(id, description);
}

function startDeliberation(uint256 resolutionId) external onlyChair {

    CorporateGovernanceStorage.Layout storage s =
        CorporateGovernanceStorage.layout();

	require(resolutionId < s.resolutionCount, "Invalid resolution");

    CorporateGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

require(
	r.status == CorporateGovernanceStorage.ResolutionStatus.Created,
    "Invalid resolution state"
);

    require(r.deliberationDeadline == 0, "Deliberation already started");
	r.status = CorporateGovernanceStorage.ResolutionStatus.Deliberation;
    r.deliberationDeadline = block.timestamp + 2 days;

}

    // VOTING
function startVoting(uint256 resolutionId) external onlyChair {
    CorporateGovernanceStorage.Layout storage s =
        CorporateGovernanceStorage.layout();

	require(resolutionId < s.resolutionCount, "Invalid resolution");

    CorporateGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Deliberation,
        "Invalid resolution state"
    );

    require(r.deliberationDeadline != 0, "Deliberation not started");

    require(
        block.timestamp >= r.deliberationDeadline,
        "Deliberation not finished"
    );

    r.status = CorporateGovernanceStorage.ResolutionStatus.Voting;
    r.votingDeadline = block.timestamp + 5 minutes;
}


function vote(uint256 resolutionId, bool support) external onlyBoard {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(ds.sessionActive, "Session not active");

	require(resolutionId < ds.resolutionCount, "Invalid resolution");

    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Voting,
        "Not in voting state"
    );

    if (block.timestamp >= r.votingDeadline) {
        _closeResolution(resolutionId);
        return;
    }

    require(!r.voted[msg.sender], "Already voted");

    r.voted[msg.sender] = true;

    if (support) {
        r.yesVotes++;
    } else {
        r.noVotes++;
    }

    emit Voted(msg.sender, resolutionId, support);
}

function _closeResolution(uint256 resolutionId) internal {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();

	require(resolutionId < ds.resolutionCount, "Invalid resolution");

    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Voting,
        "Not in voting state"
    );

    require(
        block.timestamp >= r.votingDeadline,
        "Voting still active"
    );

    uint256 totalVotes = r.yesVotes + r.noVotes;
    uint256 quorum = (ds.boardMemberCount * ds.quorumPercentage) / 100;

    if (totalVotes < quorum) {
        r.status = CorporateGovernanceStorage.ResolutionStatus.Rejected;
    } else if (r.yesVotes > r.noVotes) {
        r.status = CorporateGovernanceStorage.ResolutionStatus.Approved;
    } else {
        r.status = CorporateGovernanceStorage.ResolutionStatus.Rejected;
    }

    emit ResolutionClosed(
        resolutionId,
        r.status == CorporateGovernanceStorage.ResolutionStatus.Approved,
        r.yesVotes,
        r.noVotes
    );
}

function closeResolution(uint256 resolutionId) external {
    _closeResolution(resolutionId);
}

function executeResolution(uint256 resolutionId) external {
    CorporateGovernanceStorage.Layout storage ds =
        CorporateGovernanceStorage.layout();

	require(resolutionId < ds.resolutionCount, "Invalid resolution");

    CorporateGovernanceStorage.Resolution storage r =
        ds.resolutions[resolutionId];

require(
    r.status == CorporateGovernanceStorage.ResolutionStatus.Approved,
    "Resolution not approved"
);

    require(!r.executed, "Already executed");

    require(msg.sender == r.responsible, "Not responsible");

    r.executed = true;
    r.status = CorporateGovernanceStorage.ResolutionStatus.Executed;
}

function verifyResolution(uint256 resolutionId) external onlyVerifier {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();

	require(resolutionId < ds.resolutionCount, "Invalid resolution");

    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Executed,
        "Not executed"
    );

    r.status = CorporateGovernanceStorage.ResolutionStatus.Verified;

    emit ResolutionVerified(resolutionId, msg.sender);
}

function setQuorumPercentage(uint256 newPercentage) external onlyChair {
    require(newPercentage > 0 && newPercentage <= 100, "Invalid percentage");
    CorporateGovernanceStorage.layout().quorumPercentage = newPercentage;
}

function setGovernanceExecutor(address executor) external {
	require(msg.sender == AppStorage.layout().owner, "Not owner");
    AppStorage.layout().governanceExecutor = executor;
}

}


