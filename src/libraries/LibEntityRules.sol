// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

library LibEntityRules {
    uint256 internal constant GENERIC_UNIVERSITY_ID = 0;
    uint256 internal constant UNIVALLE_UNIVERSITY_ID = 1000;

    uint256 internal constant GENERIC_CAMPUS_ID = 1;
    uint256 internal constant SF_CAMPUS_ID = 1001;
    uint256 internal constant MLD_CAMPUS_ID = 1002;

    function universityExists(AppStorage.Layout storage s, uint256 universityId) internal view returns (bool) {
        return bytes(s.universities[universityId].name).length > 0;
    }

    function campusExists(AppStorage.Layout storage s, uint256 campusId) internal view returns (bool) {
        return s.campuses[campusId].id != 0;
    }

    function programExists(AppStorage.Layout storage s, uint256 programId) internal view returns (bool) {
        return s.programs[programId].id != 0;
    }

    function isSupportedUniversityId(uint256 universityId) internal pure returns (bool) {
        return universityId == GENERIC_UNIVERSITY_ID || universityId == UNIVALLE_UNIVERSITY_ID;
    }

    function isSupportedCampusId(uint256 campusId) internal pure returns (bool) {
        return campusId == GENERIC_CAMPUS_ID || campusId == SF_CAMPUS_ID || campusId == MLD_CAMPUS_ID;
    }

    function isSupportedProgramId(uint256 programId) internal pure returns (bool) {
        return (programId >= 1001101 && programId <= 1001107) || (programId >= 1001201 && programId <= 1001208);
    }
}
