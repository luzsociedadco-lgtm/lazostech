// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {UniversityGovernanceStorage} from "./storage/UniversityGovernanceStorage.sol";

contract UniversityGovernanceFacet {

    function us()
        internal
        pure
        returns (UniversityGovernanceStorage.Layout storage)
    {
        return UniversityGovernanceStorage.layout();
    }

    // EVENTS
    event UniversityInitialized();
    event MemberAdded(address member);
    event SessionOpened();
    event ResolutionCreated(uint256 id, string description);
    event Voted(address voter, uint256 resolutionId, bool support);
    event ResolutionClosed(uint256 id, bool approved);
    event ExecutorAssigned(uint256 id, address executor);
    event ActivityCompleted(uint256 id, address executor);
    event IncentiveRedeemed(address executor, uint256 amount);

    // ================================
    // INIT (Diamond Safe)
    // ================================
function initUniversityDao() external onlyAdmin {
    UniversityGovernanceStorage.Layout storage s = us();
    require(!s.initialized, "Already initialized");

    s.initialized = true;
    s.sessionActive = false;
    s.quorumPercentage = 40;

    emit UniversityInitialized();
}

    // ================================
    // MEMBERSHIP
    // ================================

    function addMember(address member) external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();

	require(member != address(0), "Invalid member");
        require(!s.members[member], "Already member");

        s.members[member] = true;
        s.memberCount++;

        emit MemberAdded(member);
    }

modifier onlyMember() {
    _onlyMember();
    _;
}
function _onlyMember() internal view {
    require(us().members[msg.sender], "Not assembly member");
}

modifier onlyAdmin() {
    _onlyAdmin();
    _;
}
function _onlyAdmin() internal view {
    require(
        AppStorage.layout().owner == msg.sender,
        "Not admin"
    );
}
    // ================================
    // SESSION
    // ================================

    function openUniversitySession() external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(!s.sessionActive, "Session active");

        s.sessionActive = true;

        emit SessionOpened();
    }

    // ================================
    // RESOLUTIONS
    // ================================

function createUniversityResolution(string calldata description)
        external onlyMember
    {
        UniversityGovernanceStorage.Layout storage s = us();
        require(s.sessionActive, "Session not active");

        uint256 resolutionId = s.resolutionCount;

        UniversityGovernanceStorage.Resolution storage r =
            s.resolutions[resolutionId];

        r.description = description;
        r.status =
            UniversityGovernanceStorage.ResolutionStatus.Created;

        s.resolutionCount++;

        emit ResolutionCreated(resolutionId, description);
    }

function startUniversityDeliberation(uint256 resolutionId) external onlyMember {

    UniversityGovernanceStorage.Layout storage s =
        UniversityGovernanceStorage.layout();

	require(resolutionId < s.resolutionCount, "Invalid resolution");

    UniversityGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

  require(
    r.status == UniversityGovernanceStorage.ResolutionStatus.Created,
    "Invalid resolution state"
	);

    require(r.deliberationDeadline == 0, "Deliberation already started");

	r.status = UniversityGovernanceStorage.ResolutionStatus.Deliberation;
    r.deliberationDeadline = block.timestamp + 25 minutes;
}


function startUniversityVoting(uint256 resolutionId) external onlyMember {
    UniversityGovernanceStorage.Layout storage s = us();

	require(resolutionId < s.resolutionCount, "Invalid resolution");

    UniversityGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

require(
    r.status == UniversityGovernanceStorage.ResolutionStatus.Deliberation,
    "Invalid resolution state"
);

    require(r.deliberationDeadline != 0, "Deliberation not started");

    require(
        block.timestamp >= r.deliberationDeadline,
        "Deliberation not finished"
    );

    r.status = UniversityGovernanceStorage.ResolutionStatus.Voting;
    r.votingDeadline = block.timestamp + 15 minutes;
}


function voteUniversity(uint256 resolutionId, bool support)
    external
    onlyMember
{
    UniversityGovernanceStorage.Layout storage s = us();

	require(resolutionId < s.resolutionCount, "Invalid resolution");

    UniversityGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

require(
    r.status == UniversityGovernanceStorage.ResolutionStatus.Voting,
    "Voting not active"
);

    require(
        block.timestamp <= r.votingDeadline,
        "Voting closed"
    );

    require(!r.voted[msg.sender], "Already voted");

    r.voted[msg.sender] = true;

    if (support) {
        r.yesVotes++;
    } else {
        r.noVotes++;
    }

    emit Voted(msg.sender, resolutionId, support);
}


function closeUniversityResolution(uint256 resolutionId) external {
    UniversityGovernanceStorage.Layout storage s = us();

	require(resolutionId < s.resolutionCount, "Invalid resolution");

    UniversityGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

    require(
        r.status == UniversityGovernanceStorage.ResolutionStatus.Voting,
        "Not in voting state"
    );

    require(
        block.timestamp >= r.votingDeadline,
        "Voting still active"
    );

    uint256 totalVotes = r.yesVotes + r.noVotes;
    uint256 quorum = (s.memberCount * s.quorumPercentage) / 100;

    if (totalVotes < quorum) {
        r.status = UniversityGovernanceStorage.ResolutionStatus.Rejected;
    } else if (r.yesVotes > r.noVotes) {
        r.status = UniversityGovernanceStorage.ResolutionStatus.Approved;
    } else {
        r.status = UniversityGovernanceStorage.ResolutionStatus.Rejected;
    }

    emit ResolutionClosed(
        resolutionId,
        r.status == UniversityGovernanceStorage.ResolutionStatus.Approved
    );
}

    // ================================
    // EXECUTION FLOW
    // ================================

function assignExecutor(uint256 resolutionId, address executor)
    external
    onlyAdmin
{
	UniversityGovernanceStorage.Layout storage s = us();

    require(executor != address(0), "Invalid executor");
	require(resolutionId < s.resolutionCount, "Invalid resolution");

    UniversityGovernanceStorage.Resolution storage r =
        us().resolutions[resolutionId];

require(
    r.status == UniversityGovernanceStorage.ResolutionStatus.Approved,
    "Resolution not approved"
);

    require(r.executor == address(0), "Executor already assigned");

    r.executor = executor;
    us().executors[executor].assigned = true;

    emit ExecutorAssigned(resolutionId, executor);
}


function markActivityCompleted(uint256 resolutionId) external {

        UniversityGovernanceStorage.Layout storage s = us();

	require(resolutionId < s.resolutionCount, "Invalid resolution");

        UniversityGovernanceStorage.Resolution storage r =
            s.resolutions[resolutionId];

        require(msg.sender == r.executor, "Not executor");
        require(!r.executed, "Already executed");

        r.executed = true;
        r.status =
            UniversityGovernanceStorage.ResolutionStatus.Executed;

        s.executors[msg.sender].completedActivities++;
        s.executors[msg.sender].redeemableRewards += 10 ether;

        emit ActivityCompleted(resolutionId, msg.sender);
    }

function redeemIncentive() external {

        UniversityGovernanceStorage.Executor storage ex =
            us().executors[msg.sender];

        uint256 reward = ex.redeemableRewards;
        require(reward > 0, "No rewards");

        ex.redeemableRewards = 0;
	
	AppStorage.Layout storage s = AppStorage.layout();
	s.nudosBalance[msg.sender] += reward;

        emit IncentiveRedeemed(msg.sender, reward);
    }
}
