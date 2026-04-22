// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CorporateGovernanceStorage} from "./storage/CorporateGovernanceStorage.sol";

contract CorporateGovernanceViewFacet {
    function getCorporateResolutionCount() external view returns (uint256) {
        return CorporateGovernanceStorage.layout().resolutionCount;
    }

    function getCorporateResolution(uint256 id)
        external
        view
        returns (
            string memory description,
            uint256 yesVotes,
            uint256 noVotes,
            CorporateGovernanceStorage.ResolutionStatus
        )
    {
        CorporateGovernanceStorage.Resolution storage r = CorporateGovernanceStorage.layout().resolutions[id];

        return (r.description, r.yesVotes, r.noVotes, r.status);
    }

    function isCorporateActiveMember(address user) external view returns (bool) {
        return CorporateGovernanceStorage.layout().activeMembers[user];
    }

    function getCorporateSessionState()
        external
        view
        returns (
            bool sessionActive,
            uint256 activeMemberCount,
            uint256 sessionStartResolutionId,
            uint256 executionTaskCount
        )
    {
        CorporateGovernanceStorage.Layout storage s = CorporateGovernanceStorage.layout();
        return (s.sessionActive, s.activeMemberCount, s.sessionStartResolutionId, s.executionTaskCount);
    }

    function getCorporateExecutionTask(uint256 taskId)
        external
        view
        returns (uint256 id, uint256 resolutionId, address executor, uint256 createdAt, bool completed)
    {
        CorporateGovernanceStorage.ExecutionTask storage task =
            CorporateGovernanceStorage.layout().executionTasks[taskId];
        return (task.id, task.resolutionId, task.executor, task.createdAt, task.completed);
    }
}
