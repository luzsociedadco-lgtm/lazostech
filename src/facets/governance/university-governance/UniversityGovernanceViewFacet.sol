// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {UniversityGovernanceStorage} from "./storage/UniversityGovernanceStorage.sol";

contract UniversityGovernanceViewFacet {
    function us() internal pure returns (UniversityGovernanceStorage.Layout storage) {
        return UniversityGovernanceStorage.layout();
    }

    function getResolution(uint256 id)
        external
        view
        returns (
            string memory description,
            uint256 yesVotes,
            uint256 noVotes,
            UniversityGovernanceStorage.ResolutionStatus status,
            address executor,
            bool executed
        )
    {
        UniversityGovernanceStorage.Resolution storage r = us().resolutions[id];

        return (r.description, r.yesVotes, r.noVotes, r.status, r.executor, r.executed);
    }

    function isMember(address user) external view returns (bool) {
        return us().members[user];
    }

    function isActiveMember(address user) external view returns (bool) {
        return us().activeMembers[user];
    }

    function getResolutionCount() external view returns (uint256) {
        return us().resolutionCount;
    }

    function getExecutorInfo(address user)
        external
        view
        returns (uint256 completedActivities, uint256 redeemableRewards)
    {
        UniversityGovernanceStorage.Executor storage ex = us().executors[user];

        return (ex.completedActivities, ex.redeemableRewards);
    }

    function getSessionState()
        external
        view
        returns (
            bool sessionActive,
            uint256 activeMemberCount,
            uint256 sessionStartResolutionId,
            uint256 executionTaskCount
        )
    {
        UniversityGovernanceStorage.Layout storage s = us();
        return (s.sessionActive, s.activeMemberCount, s.sessionStartResolutionId, s.executionTaskCount);
    }

    function getExecutionTask(uint256 taskId)
        external
        view
        returns (
            uint256 id,
            uint256 resolutionId,
            address executor,
            uint256 rewardAmount,
            uint256 createdAt,
            bool completed
        )
    {
        UniversityGovernanceStorage.ExecutionTask storage task = us().executionTasks[taskId];
        return (task.id, task.resolutionId, task.executor, task.rewardAmount, task.createdAt, task.completed);
    }
}
