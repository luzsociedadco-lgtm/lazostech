// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {LibEntityRules} from "src/libraries/LibEntityRules.sol";

contract ProfileFacet {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ProfileRegistered(address indexed owner, uint256 universityId, uint8 role);

    event ProfileUpdated(address indexed owner);

    /*//////////////////////////////////////////////////////////////
                           PROFILE MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function registerProfile(string calldata metadataURI, uint256 universityId, uint8 role) external {
        AppStorage.Layout storage s = AppStorage.layout();
        role;

        // Pilot catalog: during the MVP we only accept the generic profile
        // bucket or the institutional profile for Universidad del Valle.
        require(LibEntityRules.isSupportedUniversityId(universityId), "Unsupported university");

        // `0000` is valid for generic users, so existence is checked by name
        // instead of the historical `id != 0` sentinel.
        require(LibEntityRules.universityExists(s, universityId), "University not found");

        require(bytes(metadataURI).length > 0, "Metadata required");

        AppStorage.Profile storage p = s.profiles[msg.sender];
        require(!p.exists, "Profile already exists");

        p.owner = msg.sender;
        p.metadataURI = metadataURI;
        p.universityId = universityId;
        // Pilot rule: every new profile starts as a regular student.
        p.role = AppStorage.Role.Student;
        p.exists = true;

        s.profileOwners.push(msg.sender);

        emit ProfileRegistered(msg.sender, universityId, uint8(AppStorage.Role.Student));
    }

    function updateProfile(string calldata metadataURI) external {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Profile storage p = s.profiles[msg.sender];

        require(p.exists, "Profile not found");
        require(bytes(metadataURI).length > 0, "Metadata required");

        p.metadataURI = metadataURI;

        emit ProfileUpdated(msg.sender);
    }

    function getProfile(address owner) external view returns (address, string memory, uint256, uint8) {
        AppStorage.Profile storage p = AppStorage.layout().profiles[owner];

        require(p.exists, "Profile not found");

        return (p.owner, p.metadataURI, p.universityId, uint8(p.role));
    }

    function listProfiles() external view returns (address[] memory) {
        return AppStorage.layout().profileOwners;
    }
}
