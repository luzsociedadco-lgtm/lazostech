// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract CampusFacet {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event CampusCreated(uint256 indexed campusId, string name);
    event CampusUpdated(uint256 indexed campusId, string name);
    event CampusStaffAdded(uint256 indexed campusId, address staff);
    event CampusStaffRemoved(uint256 indexed campusId, address staff);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyUniversityStaff() {
        _checkUniversityStaff();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           CAMPUS MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function _checkUniversityStaff() internal view {
        AppStorage.Layout storage s = AppStorage.layout();
        require(s.isUniversityStaff[msg.sender], "CampusFacet: not university staff");
    }

function createCampus(
    uint256 campusId,
    uint256 universityId,
    string calldata name,
    string calldata metadataURI
) external onlyUniversityStaff {

    AppStorage.Layout storage s = AppStorage.layout();
    AppStorage.Campus storage c = s.campuses[campusId];

    require(s.universities[universityId].id != 0, "University not found");

    require(c.id == 0, "Campus exists");

    c.id = campusId;
    c.universityId = universityId;
    c.name = name;
    c.metadataURI = metadataURI;

    // 🔗 LINK BIDIRECCIONAL
    s.universities[universityId].campusIds.push(campusId);
    s.campusIds.push(campusId);

    emit CampusCreated(campusId, name);
}

    function updateCampus(uint256 campusId, string calldata newName, string calldata newMetadataURI)
        external
        onlyUniversityStaff
    {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Campus storage c = s.campuses[campusId];

        require(bytes(c.name).length != 0, "Campus not found");

        c.name = newName;
        c.metadataURI = newMetadataURI;

        emit CampusUpdated(campusId, newName);
    }

    function addCampusStaff(uint256 campusId, address staff) external onlyUniversityStaff {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Campus storage c = s.campuses[campusId];

	require(c.id != 0, "Campus not found");
	require(staff != address(0), "Invalid staff");

        if (!c.isStaff[staff]) {
            c.isStaff[staff] = true;
            c.staffList.push(staff);
            emit CampusStaffAdded(campusId, staff);
        }
    }

    function removeCampusStaff(uint256 campusId, address staff) external onlyUniversityStaff {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Campus storage c = s.campuses[campusId];

	require(c.id != 0, "Campus not found");

        if (c.isStaff[staff]) {
            c.isStaff[staff] = false;
            emit CampusStaffRemoved(campusId, staff);
        }
    }

    function isCampusStaff(uint256 campusId, address who) external view returns (bool) {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.campuses[campusId].isStaff[who];
    }


function getCampus(uint256 campusId)
    external
    view
    returns (
        uint256 id,
        uint256 universityId,
        string memory name,
        string memory metadataURI,
        address[] memory staffList
    )
{
    AppStorage.Layout storage s = AppStorage.layout();
    AppStorage.Campus storage c = s.campuses[campusId];

    return (
        c.id,
        c.universityId,
        c.name,
        c.metadataURI,
        c.staffList
    );
}


function listCampusIds() external view returns (uint256[] memory) {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.campusIds;
    }
}
