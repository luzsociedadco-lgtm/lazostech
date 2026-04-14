// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { LibAccessControl } from "../../../libraries/LibAccessControl.sol";
import { CorporateGovernanceStorage } from "./storage/CorporateGovernanceStorage.sol";

contract CancelResolutionFacet {

    event ResolutionCancelled(uint256 resolutionId);

function cancelResolution(uint256 resolutionId) external {
    require(
        LibAccessControl.hasRole(LibAccessControl.ASSEMBLY_ADMIN_ROLE, msg.sender),
        "Not assembly admin"
    );

    CorporateGovernanceStorage.Layout storage l =
        CorporateGovernanceStorage.layout();

    CorporateGovernanceStorage.Resolution storage r =
        l.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Created,
        "Cannot cancel after voting starts"
    );

    r.status = CorporateGovernanceStorage.ResolutionStatus.Cancelled;
	emit ResolutionCancelled(resolutionId);
}

}
