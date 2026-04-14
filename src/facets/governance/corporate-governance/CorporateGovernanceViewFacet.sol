// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CorporateGovernanceStorage} from "./storage/CorporateGovernanceStorage.sol";

contract CorporateGovernanceViewFacet {

    function getResolutionCount() external view returns (uint256) {
        return CorporateGovernanceStorage.layout().resolutionCount;
    }

    function getResolution(uint256 id)
        external
        view
        returns (
            string memory description,
            uint256 yesVotes,
            uint256 noVotes,
            CorporateGovernanceStorage.ResolutionStatus
        )
    {
        CorporateGovernanceStorage.Resolution storage r =
            CorporateGovernanceStorage.layout().resolutions[id];

        return (r.description, r.yesVotes, r.noVotes, r.status);
    }
}
