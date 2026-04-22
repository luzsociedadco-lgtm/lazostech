// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

library LibNudosAccess {
    function isOwner(address account) internal view returns (bool) {
        return account == AppStorage.layout().owner;
    }

    function isSystemAdmin(address account) internal view returns (bool) {
        return AppStorage.layout().isSystemAdmin[account];
    }

    function isOwnerOrSystemAdmin(address account) internal view returns (bool) {
        return isOwner(account) || isSystemAdmin(account);
    }

    function isUniversityGovernanceActor(address account) internal view returns (bool) {
        AppStorage.Layout storage s = AppStorage.layout();
        return isOwnerOrSystemAdmin(account) || s.isUniversityStaff[account];
    }

    function enforceOwner() internal view {
        require(isOwner(msg.sender), "Not owner");
    }

    function enforceOwnerOrSystemAdmin() internal view {
        require(isOwnerOrSystemAdmin(msg.sender), "Not authorized");
    }

    function enforceUniversityGovernanceActor() internal view {
        require(isUniversityGovernanceActor(msg.sender), "Not governance actor");
    }
}
