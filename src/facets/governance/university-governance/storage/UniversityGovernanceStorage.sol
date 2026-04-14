// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library UniversityGovernanceStorage {

    bytes32 constant STORAGE_POSITION =
        keccak256("lazostech.storage.university.governance");

    enum ResolutionStatus {
        Created,
	Deliberation,
	Voting,
        Approved,
        Rejected,
        Closed,
        Executed
    }

    struct Executor {
        bool assigned;
        uint256 completedActivities;
        uint256 redeemableRewards;
    }

struct Resolution {

    string description;

    uint256 deliberationDeadline;
    uint256 votingDeadline;

    uint256 yesVotes;
    uint256 noVotes;

    ResolutionStatus status;

    mapping(address => bool) voted;

    address executor;
    bool executed;
}

    struct Layout {
        bool initialized;
        bool sessionActive;

        mapping(address => bool) members;
        uint256 memberCount;

        uint256 quorumPercentage;

        uint256 resolutionCount;
        mapping(uint256 => Resolution) resolutions;

        mapping(address => Executor) executors;
    }

    function layout() internal pure returns (Layout storage l) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            l.slot := position
        }
    }
}
