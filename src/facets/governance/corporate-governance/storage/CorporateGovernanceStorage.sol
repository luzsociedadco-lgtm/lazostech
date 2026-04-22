// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library CorporateGovernanceStorage {
    bytes32 constant STORAGE_POSITION = keccak256("lazostech.storage.corporate.governance");

    enum ResolutionStatus {
        Created,
        Deliberation,
        Voting,
        Approved,
        Rejected,
        Executed,
        Verified,
        Cancelled
    }

    struct Resolution {
        uint256 id;
        string title;
        string description;

        uint256 deliberationDeadline;
        uint256 votingDeadline;

        uint256 yesVotes;
        uint256 noVotes;

        ResolutionStatus status;

        address responsible;
        uint256 reward;

        bool executed;
        bool executionTaskCreated;

        mapping(address => bool) voted;
    }

    struct ExecutionTask {
        uint256 id;
        uint256 resolutionId;
        address executor;
        uint256 createdAt;
        bool completed;
    }

    struct Layout {
        bool initialized;
        bool sessionActive;

        address chairperson;
        address secretary;
        mapping(address => bool) boardMembers;
        uint256 boardMemberCount;

        address nudosToken;
        uint256 quorumPercentage;

        uint256 resolutionCount;
        mapping(uint256 => Resolution) resolutions;
        mapping(address => bool) activeMembers;
        uint256 activeMemberCount;
        uint256 sessionStartResolutionId;
        uint256 executionTaskCount;
        mapping(uint256 => ExecutionTask) executionTasks;
    }

    function layout() internal pure returns (Layout storage l) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            l.slot := position
        }
    }
}
