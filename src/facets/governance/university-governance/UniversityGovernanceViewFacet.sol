// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {UniversityGovernanceStorage} from "./storage/UniversityGovernanceStorage.sol";

contract UniversityGovernanceViewFacet {

    function us()
        internal
        pure
        returns (UniversityGovernanceStorage.Layout storage)
    {
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
        UniversityGovernanceStorage.Resolution storage r =
            us().resolutions[id];

        return (
            r.description,
            r.yesVotes,
            r.noVotes,
            r.status,
            r.executor,
            r.executed
        );
    }

    function isMember(address user)
        external
        view
        returns (bool)
    {
        return us().members[user];
    }

    function getResolutionCount()
        external
        view
        returns (uint256)
    {
        return us().resolutionCount;
    }

    function getExecutorInfo(address user)
        external
        view
        returns (
            uint256 completedActivities,
            uint256 redeemableRewards
        )
    {
        UniversityGovernanceStorage.Executor storage ex =
            us().executors[user];

        return (
            ex.completedActivities,
            ex.redeemableRewards
        );
    }
}
