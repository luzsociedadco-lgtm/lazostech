// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract MachineFacet {

    event MachineRegistered(
        uint256 indexed machineId,
        uint256 campusId,
        address operator
    );

    event MachineStatusUpdated(
        uint256 indexed machineId,
        bool active
    );


function registerMachine(
        uint256 campusId,
        string calldata metadataURI,
        address operator
    ) external {

	require(campusId != 0, "Invalid campus");

        AppStorage.Layout storage s = AppStorage.layout();

	require(s.campuses[campusId].id != 0, "Campus not found");
        require(msg.sender == s.owner, "Not owner");
	require(operator != address(0), "Invalid operator");

        uint256 machineId = ++s.nextMachineId;

        s.machines[machineId] = AppStorage.Machine({
            id: machineId,
            campusId: campusId,
            metadataURI: metadataURI,
            operator: operator,
            active: true
        });

        s.machineIds.push(machineId);

        emit MachineRegistered(
            machineId,
            campusId,
            operator
        );
    }

function setMachineStatus(
        uint256 machineId,
        bool active
    ) external {

        AppStorage.Layout storage s = AppStorage.layout();
	require(s.machines[machineId].id != 0, "Machine not found");
        require(msg.sender == s.owner, "Not owner");
        s.machines[machineId].active = active;


        emit MachineStatusUpdated(machineId, active);
    }

function getMachine(uint256 machineId)
        external
        view
        returns (AppStorage.Machine memory)
    {
        return AppStorage.layout().machines[machineId];
    }

function getMachines()
        external
        view
        returns (uint256[] memory)
    {
        return AppStorage.layout().machineIds;
    }

function linkOracleToMachine(
    address oracle,
    uint256 machineId
) external {

    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == s.owner, "Not owner");
    require(oracle != address(0), "Zero oracle");
    require(s.machines[machineId].id != 0, "Machine not found");
    require(s.machines[machineId].active, "Machine inactive");
    require(!s.recyclingOracles[oracle], "Oracle already active");

    require(
        s.oracleMachine[oracle] == 0,
        "Oracle already linked"
    );

    s.recyclingOracles[oracle] = true;
    s.oracleMachine[oracle] = machineId;
}

function unlinkOracle(address oracle) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == s.owner, "Not owner");
	require(s.recyclingOracles[oracle], "Oracle not active");

    s.recyclingOracles[oracle] = false;
    s.oracleMachine[oracle] = 0;
}

}
