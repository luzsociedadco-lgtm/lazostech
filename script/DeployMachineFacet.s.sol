// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {MachineFacet} from "src/facets/machines/MachineFacet.sol";

contract DeployMachineFacet is Script {
    function run() external {
        address diamond = vm.envAddress("DIAMOND");

        vm.startBroadcast();

        // ✅ SELECTORS REALES
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = bytes4(keccak256("registerMachine(address,string)"));
        selectors[1] = bytes4(keccak256("isMachine(address)"));
        selectors[2] = bytes4(keccak256("getMachine(address)"));
        selectors[3] = bytes4(keccak256("updateMachine(address,string)"));
        selectors[4] = bytes4(keccak256("deactivateMachine(address)"));
        selectors[5] = bytes4(keccak256("getAllMachines()"));

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);

        // 🔵 SOLO ADD (porque no existen aún)
        address machineFacet = address(new MachineFacet());

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: machineFacet, action: IDiamondCut.FacetCutAction.Add, functionSelectors: selectors
        });

        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        vm.stopBroadcast();
    }
}
