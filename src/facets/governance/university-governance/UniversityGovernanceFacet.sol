// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {LibNudosAccess} from "src/libraries/LibNudosAccess.sol";
import {UniversityGovernanceStorage} from "./storage/UniversityGovernanceStorage.sol";
import {IReward} from "src/interfaces/IReward.sol";

contract UniversityGovernanceFacet {
    uint256 internal constant DEFAULT_INCENTIVE = 50 ether;

    function us() internal pure returns (UniversityGovernanceStorage.Layout storage) {
        return UniversityGovernanceStorage.layout();
    }

    event UniversityInitialized();
    event MemberAdded(address member);
    event SessionOpened(uint256 indexed startingResolutionId);
    event SessionJoined(address indexed member);
    event SessionLeft(address indexed member);
    event SessionClosed(uint256 indexed endingResolutionId, uint256 executionTasksCreated);
    event ResolutionCreated(uint256 id, string description);
    event Voted(address voter, uint256 resolutionId, bool support);
    event ResolutionClosed(uint256 id, bool approved);
    event ExecutorAssigned(uint256 id, address executor);
    event ExecutionTaskCreated(uint256 indexed taskId, uint256 indexed resolutionId, address executor);
    event ActivityCompleted(uint256 indexed taskId, address executor);
    event IncentiveRedeemed(address executor, uint256 amount);

    function initUniversityDao() external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(!s.initialized, "Already initialized");

        s.initialized = true;
        s.sessionActive = false;
        s.quorumPercentage = 40;

        emit UniversityInitialized();
    }

    function addMember(address member) external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();

        require(member != address(0), "Invalid member");
        require(!s.members[member], "Already member");

        s.members[member] = true;
        s.memberCount++;

        emit MemberAdded(member);
    }

    modifier onlyMember() {
        require(_isMember(msg.sender), "Not assembly member");
        _;
    }

    modifier onlyActiveMember() {
        require(_isActiveMember(msg.sender), "Not active member");
        _;
    }

    modifier onlyAdmin() {
        require(LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "Not admin");
        _;
    }

    function openUniversitySession() external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(!s.sessionActive, "Session active");

        s.sessionActive = true;
        s.activeMemberCount = 0;
        s.sessionStartResolutionId = s.resolutionCount;

        emit SessionOpened(s.sessionStartResolutionId);
    }

    function joinUniversitySession() external onlyMember {
        UniversityGovernanceStorage.Layout storage s = us();
        require(s.sessionActive, "Session not active");
        require(!s.activeMembers[msg.sender], "Already active");

        s.activeMembers[msg.sender] = true;
        s.activeMemberCount++;

        emit SessionJoined(msg.sender);
    }

    function leaveUniversitySession() external {
        UniversityGovernanceStorage.Layout storage s = us();
        require(s.activeMembers[msg.sender], "Not active");

        s.activeMembers[msg.sender] = false;
        if (s.activeMemberCount > 0) {
            s.activeMemberCount--;
        }

        emit SessionLeft(msg.sender);
    }

    function createUniversityResolution(string calldata description) external onlyActiveMember {
        UniversityGovernanceStorage.Layout storage s = us();
        require(s.sessionActive, "Session not active");
        require(bytes(description).length > 0, "Description required");

        uint256 resolutionId = s.resolutionCount;
        UniversityGovernanceStorage.Resolution storage r = s.resolutions[resolutionId];

        r.description = description;
        r.status = UniversityGovernanceStorage.ResolutionStatus.Created;

        s.resolutionCount++;

        emit ResolutionCreated(resolutionId, description);
    }

    function startUniversityDeliberation(uint256 resolutionId) external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(resolutionId < s.resolutionCount, "Invalid resolution");

        UniversityGovernanceStorage.Resolution storage r = s.resolutions[resolutionId];
        require(r.status == UniversityGovernanceStorage.ResolutionStatus.Created, "Invalid resolution state");
        require(r.deliberationDeadline == 0, "Deliberation already started");

        r.status = UniversityGovernanceStorage.ResolutionStatus.Deliberation;
        r.deliberationDeadline = block.timestamp + 25 minutes;
    }

    function startUniversityVoting(uint256 resolutionId) external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(resolutionId < s.resolutionCount, "Invalid resolution");

        UniversityGovernanceStorage.Resolution storage r = s.resolutions[resolutionId];
        require(r.status == UniversityGovernanceStorage.ResolutionStatus.Deliberation, "Invalid resolution state");
        require(r.deliberationDeadline != 0, "Deliberation not started");
        require(block.timestamp >= r.deliberationDeadline, "Deliberation not finished");

        r.status = UniversityGovernanceStorage.ResolutionStatus.Voting;
        r.votingDeadline = block.timestamp + 15 minutes;
    }

    function voteUniversity(uint256 resolutionId, bool support) external onlyActiveMember {
        UniversityGovernanceStorage.Layout storage s = us();
        require(resolutionId < s.resolutionCount, "Invalid resolution");

        UniversityGovernanceStorage.Resolution storage r = s.resolutions[resolutionId];
        require(r.status == UniversityGovernanceStorage.ResolutionStatus.Voting, "Voting not active");
        require(block.timestamp <= r.votingDeadline, "Voting closed");
        require(!r.voted[msg.sender], "Already voted");

        r.voted[msg.sender] = true;

        if (support) {
            r.yesVotes++;
        } else {
            r.noVotes++;
        }

        emit Voted(msg.sender, resolutionId, support);
    }

    function closeUniversityResolution(uint256 resolutionId) external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(resolutionId < s.resolutionCount, "Invalid resolution");

        UniversityGovernanceStorage.Resolution storage r = s.resolutions[resolutionId];
        require(r.status == UniversityGovernanceStorage.ResolutionStatus.Voting, "Not in voting state");
        require(block.timestamp >= r.votingDeadline, "Voting still active");

        uint256 totalVotes = r.yesVotes + r.noVotes;
        uint256 quorumBase = s.activeMemberCount == 0 ? s.memberCount : s.activeMemberCount;
        uint256 quorum = (quorumBase * s.quorumPercentage) / 100;

        if (totalVotes < quorum) {
            r.status = UniversityGovernanceStorage.ResolutionStatus.Rejected;
        } else if (r.yesVotes > r.noVotes) {
            r.status = UniversityGovernanceStorage.ResolutionStatus.Approved;
        } else {
            r.status = UniversityGovernanceStorage.ResolutionStatus.Rejected;
        }

        emit ResolutionClosed(resolutionId, r.status == UniversityGovernanceStorage.ResolutionStatus.Approved);
    }

    function assignExecutor(uint256 resolutionId, address executor) external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(executor != address(0), "Invalid executor");
        require(resolutionId < s.resolutionCount, "Invalid resolution");

        UniversityGovernanceStorage.Resolution storage r = s.resolutions[resolutionId];
        require(r.status == UniversityGovernanceStorage.ResolutionStatus.Approved, "Resolution not approved");
        require(r.executor == address(0), "Executor already assigned");

        r.executor = executor;
        s.executors[executor].assigned = true;

        emit ExecutorAssigned(resolutionId, executor);
    }

    function closeUniversitySession() external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(s.sessionActive, "Session not active");

        uint256 createdTasks = 0;
        for (uint256 i = s.sessionStartResolutionId; i < s.resolutionCount; i++) {
            UniversityGovernanceStorage.Resolution storage r = s.resolutions[i];

            require(
                r.status != UniversityGovernanceStorage.ResolutionStatus.Created
                    && r.status != UniversityGovernanceStorage.ResolutionStatus.Deliberation
                    && r.status != UniversityGovernanceStorage.ResolutionStatus.Voting,
                "Pending resolution"
            );

            if (r.status == UniversityGovernanceStorage.ResolutionStatus.Approved) {
                require(r.executor != address(0), "Approved resolution without executor");

                if (!r.executionTaskCreated) {
                    uint256 taskId = ++s.executionTaskCount;
                    s.executionTasks[taskId] = UniversityGovernanceStorage.ExecutionTask({
                        id: taskId,
                        resolutionId: i,
                        executor: r.executor,
                        rewardAmount: DEFAULT_INCENTIVE,
                        createdAt: block.timestamp,
                        completed: false
                    });
                    r.executionTaskCreated = true;
                    createdTasks++;

                    emit ExecutionTaskCreated(taskId, i, r.executor);
                }
            }
        }

        s.sessionActive = false;
        s.activeMemberCount = 0;

        emit SessionClosed(s.resolutionCount, createdTasks);
    }

    function markActivityCompleted(uint256 taskId) external {
        UniversityGovernanceStorage.Layout storage s = us();
        UniversityGovernanceStorage.ExecutionTask storage task = s.executionTasks[taskId];

        require(task.id != 0, "Execution task not found");
        require(msg.sender == task.executor, "Not executor");
        require(!task.completed, "Already completed");

        task.completed = true;

        UniversityGovernanceStorage.Resolution storage r = s.resolutions[task.resolutionId];
        r.executed = true;
        r.status = UniversityGovernanceStorage.ResolutionStatus.Executed;

        s.executors[msg.sender].completedActivities++;
        s.executors[msg.sender].redeemableRewards += task.rewardAmount;

        emit ActivityCompleted(taskId, msg.sender);
    }

    function redeemIncentive() external {
        UniversityGovernanceStorage.Executor storage ex = us().executors[msg.sender];

        uint256 reward = ex.redeemableRewards;
        require(reward > 0, "No rewards");

        ex.redeemableRewards = 0;
        IReward(address(this)).grantReward(msg.sender, reward);

        emit IncentiveRedeemed(msg.sender, reward);
    }

    function _isMember(address account) internal view returns (bool) {
        return us().members[account] || LibNudosAccess.isUniversityGovernanceActor(account);
    }

    function _isActiveMember(address account) internal view returns (bool) {
        return us().activeMembers[account] || LibNudosAccess.isUniversityGovernanceActor(account);
    }
}
