// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CorporateGovernanceStorage} from "./storage/CorporateGovernanceStorage.sol";
import {AppStorage} from "src/libraries/AppStorage.sol";
import {LibNudosAccess} from "src/libraries/LibNudosAccess.sol";

contract CorporateGovernanceFacet {
    function gs() internal pure returns (CorporateGovernanceStorage.Layout storage) {
        return CorporateGovernanceStorage.layout();
    }

    event ChairpersonSet(address chairperson);
    event SecretarySet(address secretary);
    event BoardMemberAdded(address member);
    event SessionOpened(string name, uint256 startingResolutionId);
    event SessionJoined(address indexed member);
    event SessionLeft(address indexed member);
    event SessionClosed(uint256 indexed endingResolutionId, uint256 executionTasksCreated);
    event ResolutionCreated(uint256 id, string description);
    event Voted(address voter, uint256 resolutionId, bool support);
    event ResolutionClosed(uint256 id, bool approved, uint256 yesVotes, uint256 noVotes);
    event ExecutorAssigned(uint256 id, address executor);
    event ExecutionTaskCreated(uint256 indexed taskId, uint256 indexed resolutionId, address executor);
    event ResolutionExecuted(uint256 id, address operator);
    event ResolutionVerified(uint256 id, address verifier);

    modifier onlyChair() {
        require(msg.sender == gs().chairperson || LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "Not chairperson");
        _;
    }

    modifier onlyBoard() {
        require(gs().boardMembers[msg.sender] || LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "Not board member");
        _;
    }

    modifier onlySecretaryOrChair() {
        require(
            msg.sender == gs().chairperson || msg.sender == gs().secretary
                || LibNudosAccess.isOwnerOrSystemAdmin(msg.sender),
            "Not verifier"
        );
        _;
    }

    modifier onlyActiveBoard() {
        require(gs().activeMembers[msg.sender] || LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "Not active member");
        _;
    }

    function _ensureResolutionClosable(CorporateGovernanceStorage.Resolution storage r) internal view {
        require(
            r.status != CorporateGovernanceStorage.ResolutionStatus.Created
                && r.status != CorporateGovernanceStorage.ResolutionStatus.Deliberation
                && r.status != CorporateGovernanceStorage.ResolutionStatus.Voting,
            "Pending resolution"
        );
    }

    function _createExecutionTask(CorporateGovernanceStorage.Layout storage ds, uint256 resolutionId, address executor)
        internal
        returns (uint256 taskId)
    {
        taskId = ++ds.executionTaskCount;
        ds.executionTasks[taskId] = CorporateGovernanceStorage.ExecutionTask({
            id: taskId, resolutionId: resolutionId, executor: executor, createdAt: block.timestamp, completed: false
        });
    }

    function _findExecutionTaskId(CorporateGovernanceStorage.Layout storage ds, uint256 resolutionId)
        internal
        view
        returns (uint256)
    {
        for (uint256 taskId = 1; taskId <= ds.executionTaskCount; taskId++) {
            if (ds.executionTasks[taskId].resolutionId == resolutionId) {
                return taskId;
            }
        }
        return 0;
    }

    function initDao() external {
        require(LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "Not authorized");

        CorporateGovernanceStorage.Layout storage ds = gs();
        require(!ds.initialized, "Already initialized");

        ds.initialized = true;
        ds.sessionActive = false;
        ds.nudosToken = 0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C;
        ds.quorumPercentage = 40;
    }

    function setChairperson(address chair) external {
        require(LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "Not authorized");
        require(chair != address(0), "Invalid chairperson");

        gs().chairperson = chair;
        emit ChairpersonSet(chair);
    }

    function setSecretary(address secretary) external onlyChair {
        require(secretary != address(0), "Invalid secretary");
        gs().secretary = secretary;
        emit SecretarySet(secretary);
    }

    function addBoardMember(address member) external onlyChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(member != address(0), "Invalid member");
        require(!ds.boardMembers[member], "Already board member");

        ds.boardMembers[member] = true;
        ds.boardMemberCount++;

        emit BoardMemberAdded(member);
    }

    function openSession(string calldata name) external onlyChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(!ds.sessionActive, "Session already active");

        ds.sessionActive = true;
        ds.activeMemberCount = 0;
        ds.sessionStartResolutionId = ds.resolutionCount;

        emit SessionOpened(name, ds.sessionStartResolutionId);
    }

    function joinSession() external onlyBoard {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(ds.sessionActive, "Session not active");
        require(!ds.activeMembers[msg.sender], "Already active");

        ds.activeMembers[msg.sender] = true;
        ds.activeMemberCount++;

        emit SessionJoined(msg.sender);
    }

    function leaveSession() external {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(ds.activeMembers[msg.sender], "Not active");

        ds.activeMembers[msg.sender] = false;
        if (ds.activeMemberCount > 0) {
            ds.activeMemberCount--;
        }

        emit SessionLeft(msg.sender);
    }

    function createResolution(string calldata description, address responsible) external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(ds.sessionActive, "Session not active");
        require(bytes(description).length > 0, "Description required");

        uint256 id = ds.resolutionCount;
        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[id];

        r.id = id;
        r.description = description;
        r.responsible = responsible;
        r.status = CorporateGovernanceStorage.ResolutionStatus.Created;

        ds.resolutionCount++;

        emit ResolutionCreated(id, description);
    }

    function startDeliberation(uint256 resolutionId) external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(resolutionId < ds.resolutionCount, "Invalid resolution");

        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];
        require(r.status == CorporateGovernanceStorage.ResolutionStatus.Created, "Invalid resolution state");
        require(r.deliberationDeadline == 0, "Deliberation already started");

        r.status = CorporateGovernanceStorage.ResolutionStatus.Deliberation;
        r.deliberationDeadline = block.timestamp + 2 days;
    }

    function startVoting(uint256 resolutionId) external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(resolutionId < ds.resolutionCount, "Invalid resolution");

        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];
        require(r.status == CorporateGovernanceStorage.ResolutionStatus.Deliberation, "Invalid resolution state");
        require(r.deliberationDeadline != 0, "Deliberation not started");
        require(block.timestamp >= r.deliberationDeadline, "Deliberation not finished");

        r.status = CorporateGovernanceStorage.ResolutionStatus.Voting;
        r.votingDeadline = block.timestamp + 5 minutes;
    }

    function vote(uint256 resolutionId, bool support) external onlyActiveBoard {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(ds.sessionActive, "Session not active");
        require(resolutionId < ds.resolutionCount, "Invalid resolution");

        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];
        require(r.status == CorporateGovernanceStorage.ResolutionStatus.Voting, "Not in voting state");
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

    function closeResolution(uint256 resolutionId) external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(resolutionId < ds.resolutionCount, "Invalid resolution");

        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];
        require(r.status == CorporateGovernanceStorage.ResolutionStatus.Voting, "Not in voting state");
        require(block.timestamp >= r.votingDeadline, "Voting still active");

        uint256 totalVotes = r.yesVotes + r.noVotes;
        uint256 quorumBase = ds.activeMemberCount == 0 ? ds.boardMemberCount : ds.activeMemberCount;
        uint256 quorum = (quorumBase * ds.quorumPercentage) / 100;

        if (totalVotes < quorum) {
            r.status = CorporateGovernanceStorage.ResolutionStatus.Rejected;
        } else if (r.yesVotes > r.noVotes) {
            r.status = CorporateGovernanceStorage.ResolutionStatus.Approved;
        } else {
            r.status = CorporateGovernanceStorage.ResolutionStatus.Rejected;
        }

        emit ResolutionClosed(
            resolutionId, r.status == CorporateGovernanceStorage.ResolutionStatus.Approved, r.yesVotes, r.noVotes
        );
    }

    function assignCorporateExecutor(uint256 resolutionId, address executor) external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(executor != address(0), "Invalid executor");
        require(resolutionId < ds.resolutionCount, "Invalid resolution");

        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];
        require(r.status == CorporateGovernanceStorage.ResolutionStatus.Approved, "Resolution not approved");
        require(r.responsible == address(0), "Executor already assigned");

        r.responsible = executor;

        emit ExecutorAssigned(resolutionId, executor);
    }

    function closeSession() external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(ds.sessionActive, "Session not active");

        uint256 createdTasks = 0;
        for (uint256 i = ds.sessionStartResolutionId; i < ds.resolutionCount; i++) {
            CorporateGovernanceStorage.Resolution storage r = ds.resolutions[i];
            _ensureResolutionClosable(r);

            if (r.status == CorporateGovernanceStorage.ResolutionStatus.Approved) {
                require(r.responsible != address(0), "Approved resolution without executor");

                if (!r.executionTaskCreated) {
                    uint256 taskId = _createExecutionTask(ds, i, r.responsible);
                    r.executionTaskCreated = true;
                    createdTasks++;

                    emit ExecutionTaskCreated(taskId, i, r.responsible);
                }
            }
        }

        ds.sessionActive = false;
        ds.activeMemberCount = 0;

        emit SessionClosed(ds.resolutionCount, createdTasks);
    }

    function executeResolution(uint256 resolutionId) external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(resolutionId < ds.resolutionCount, "Invalid resolution");

        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];
        require(r.status == CorporateGovernanceStorage.ResolutionStatus.Approved, "Resolution not approved");
        require(r.executionTaskCreated, "Execution task missing");
        require(!r.executed, "Already executed");

        r.executed = true;
        r.status = CorporateGovernanceStorage.ResolutionStatus.Executed;

        uint256 taskId = _findExecutionTaskId(ds, resolutionId);
        require(taskId != 0, "Execution task missing");
        ds.executionTasks[taskId].completed = true;

        emit ResolutionExecuted(resolutionId, msg.sender);
    }

    function verifyResolution(uint256 resolutionId) external onlySecretaryOrChair {
        CorporateGovernanceStorage.Layout storage ds = gs();
        require(resolutionId < ds.resolutionCount, "Invalid resolution");

        CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];
        require(r.status == CorporateGovernanceStorage.ResolutionStatus.Executed, "Not executed");

        r.status = CorporateGovernanceStorage.ResolutionStatus.Verified;
        emit ResolutionVerified(resolutionId, msg.sender);
    }

    function setQuorumPercentage(uint256 newPercentage) external onlyChair {
        require(newPercentage > 0 && newPercentage <= 100, "Invalid percentage");
        gs().quorumPercentage = newPercentage;
    }

    function setGovernanceExecutor(address executor) external {
        require(LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "Not authorized");
        AppStorage.layout().governanceExecutor = executor;
    }
}
