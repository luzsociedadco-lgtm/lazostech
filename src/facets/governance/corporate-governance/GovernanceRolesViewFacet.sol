// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CorporateGovernanceStorage} from "./storage/CorporateGovernanceStorage.sol";
import {UniversityGovernanceStorage} from "../university-governance/storage/UniversityGovernanceStorage.sol";
import {LibAccessControl} from "../../../libraries/LibAccessControl.sol";

contract GovernanceRolesViewFacet {
    function isChairperson(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.CHAIRPERSON_ROLE,
            account
        );
    }

    function isBoardMember(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.BOARD_MEMBER_ROLE,
            account
        );
    }

    function isAssemblyAdmin(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.ASSEMBLY_ADMIN_ROLE,
            account
        );
    }

    function isResponsible(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.RESPONSIBLE_ROLE,
            account
        );
    }

    function isProposer(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.PROPOSER_ROLE,
            account
        );
    }

    function isMember(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.MEMBER_ROLE,
            account
        );
    }

    function isUniversityMember(address user)
        external
        view
        returns (bool)
    {
        return UniversityGovernanceStorage.layout().members[user];
    }

    function getChairperson() external view returns (address) {
        return CorporateGovernanceStorage.layout().chairperson;
    }

    function getSecretary() external view returns (address) {
        return CorporateGovernanceStorage.layout().secretary;
    }
}
