// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {LibEntityRules} from "src/libraries/LibEntityRules.sol";
import {LibNudosAccess} from "src/libraries/LibNudosAccess.sol";

contract ProgramFacet {
    event ProgramCreated(uint256 indexed programId, uint256 indexed campusId, string name);
    event ProgramUpdated(uint256 indexed programId, string name);
    event ProfileAffiliationAssigned(address indexed user, uint256 universityId, uint256 campusId, uint256 programId);

    modifier onlySystemOperator() {
        require(LibNudosAccess.isOwnerOrSystemAdmin(msg.sender), "ProgramFacet: not authorized");
        _;
    }

    function createProgram(
        uint256 programId,
        uint256 campusId,
        string calldata name,
        string calldata metadataURI,
        address coordinator
    ) external onlySystemOperator {
        AppStorage.Layout storage s = AppStorage.layout();

        require(campusId != 0, "Invalid campus");
        require(LibEntityRules.campusExists(s, campusId), "Campus not found");
        require(programId != 0, "Invalid program");
        require(LibEntityRules.isSupportedProgramId(programId), "Unsupported program");
        require(bytes(name).length > 0, "Name required");

        AppStorage.Program storage p = s.programs[programId];
        require(p.id == 0, "Program exists");

        p.id = programId;
        p.campusId = campusId;
        p.name = name;
        p.metadataURI = metadataURI;
        p.coordinator = coordinator;

        s.programIds.push(programId);
        s.campuses[campusId].programIds.push(programId);

        emit ProgramCreated(programId, campusId, name);
    }

    function updateProgram(uint256 programId, string calldata name, string calldata metadataURI, address coordinator)
        external
        onlySystemOperator
    {
        AppStorage.Program storage p = AppStorage.layout().programs[programId];

        require(p.id != 0, "Program not found");
        require(LibEntityRules.isSupportedProgramId(programId), "Unsupported program");
        require(bytes(name).length > 0, "Name required");

        p.name = name;
        p.metadataURI = metadataURI;
        p.coordinator = coordinator;

        emit ProgramUpdated(programId, name);
    }

    function assignProfileAffiliation(address user, uint256 universityId, uint256 campusId, uint256 programId)
        external
        onlySystemOperator
    {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Profile storage p = s.profiles[user];

        require(user != address(0), "Invalid user");
        require(p.exists, "Profile not found");
        require(LibEntityRules.isSupportedUniversityId(universityId), "Unsupported university");
        require(LibEntityRules.universityExists(s, universityId), "University not found");
        require(LibEntityRules.campusExists(s, campusId), "Campus not found");
        require(s.campuses[campusId].universityId == universityId, "Campus mismatch");

        if (programId != 0) {
            require(LibEntityRules.isSupportedProgramId(programId), "Unsupported program");
            require(LibEntityRules.programExists(s, programId), "Program not found");
            require(s.programs[programId].campusId == campusId, "Program mismatch");
        }

        p.universityId = universityId;
        p.campusId = campusId;
        p.programId = programId;

        emit ProfileAffiliationAssigned(user, universityId, campusId, programId);
    }

    function getProgram(uint256 programId)
        external
        view
        returns (uint256 id, uint256 campusId, string memory name, string memory metadataURI, address coordinator)
    {
        AppStorage.Program storage p = AppStorage.layout().programs[programId];
        return (p.id, p.campusId, p.name, p.metadataURI, p.coordinator);
    }

    function listProgramIds() external view returns (uint256[] memory) {
        return AppStorage.layout().programIds;
    }

    function listCampusProgramIds(uint256 campusId) external view returns (uint256[] memory) {
        return AppStorage.layout().campuses[campusId].programIds;
    }

    function getProfileAffiliation(address user)
        external
        view
        returns (uint256 universityId, uint256 campusId, uint256 programId)
    {
        AppStorage.Profile storage p = AppStorage.layout().profiles[user];
        require(p.exists, "Profile not found");
        return (p.universityId, p.campusId, p.programId);
    }
}
