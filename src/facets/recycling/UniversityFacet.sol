// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract UniversityFacet {

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event ProfileRegistered(address indexed owner, uint256 universityId, uint8 role);
    event ProfileUpdated(address indexed owner);
    event UniversityStaffAdded(address indexed staff);
    event UniversityStaffRemoved(address indexed staff);
    event UniversityCreated(uint256 indexed universityId, string name);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyUniversityStaff() {
        _checkUniversityStaff();
        _;
    }

function _checkUniversityStaff() internal view {
    AppStorage.Layout storage s = AppStorage.layout();

    require(
        msg.sender == s.owner || s.isUniversityStaff[msg.sender],
        "not authorized"
    );
}

function _onlyOwnerOrStaff(AppStorage.Layout storage s) internal view {
    require(
        msg.sender == s.owner || s.isUniversityStaff[msg.sender],
        "Not authorized"
    );
}

    /*//////////////////////////////////////////////////////////////
                       UNIVERSITY STAFF MANAGEMENT
    //////////////////////////////////////////////////////////////*/

function addUniversityStaff(address staff) external {
    AppStorage.Layout storage s = AppStorage.layout();

    _onlyOwnerOrStaff(s);

    require(staff != address(0), "Invalid");

    if (!s.isUniversityStaff[staff]) {
        s.isUniversityStaff[staff] = true;
        emit UniversityStaffAdded(staff);
    }
}

function removeUniversityStaff(address staff) external onlyUniversityStaff {
        AppStorage.Layout storage s = AppStorage.layout();
        if (s.isUniversityStaff[staff]) {
            s.isUniversityStaff[staff] = false;
            emit UniversityStaffRemoved(staff);
        }
    }

function isUniversityStaff(address who) external view returns (bool) {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.isUniversityStaff[who];
    }

function createUniversity(
    uint256 universityId,
    string calldata name,
    string calldata metadataURI
	) external {

    AppStorage.Layout storage s = AppStorage.layout();
    require(msg.sender == s.owner, "Not owner");

    AppStorage.University storage u = s.universities[universityId];
    require(bytes(u.name).length == 0, "University exists");

    u.id = universityId;
    u.name = name;
    u.metadataURI = metadataURI;

    s.universityIds.push(universityId);

    emit UniversityCreated(universityId, name);
}

function getUniversity(uint256 universityId)
    external
    view
    returns (
        uint256 id,
        string memory name,
        string memory metadataURI,
        uint256[] memory campusIds
    )
{
    AppStorage.University storage u = AppStorage.layout().universities[universityId];

    return (u.id, u.name, u.metadataURI, u.campusIds);
}

function bootstrapUniversityStaff(address staff) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == s.owner, "Not owner");
    require(staff != address(0), "Invalid");

    s.isUniversityStaff[staff] = true;
}

}
