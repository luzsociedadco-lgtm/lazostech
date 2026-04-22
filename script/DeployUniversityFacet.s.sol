// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {SelectorLib} from "src/diamond/SelectorLib.sol";
import {UniversityFacet} from "src/facets/recycling/UniversityFacet.sol";

contract UpgradeUniversityClean is Script {
    function run() external {
        address diamond = vm.envAddress("DIAMOND");

        vm.startBroadcast();

        // 1. Deploy nuevo facet limpio
        UniversityFacet uf = new UniversityFacet();

        // 2. Selectors actuales a eliminar (los que ya detectaste)
        bytes4[] memory oldSelectors = new bytes4[](6);
        oldSelectors[0] = 0xd7ac88bc;
        oldSelectors[1] = 0xc99086d0;
        oldSelectors[2] = 0x7c23e57a;
        oldSelectors[3] = 0xce1bf4c4;
        oldSelectors[4] = 0x487c0ad7;
        oldSelectors[5] = 0x92372fc4;

        // 3. Nuevo set completo desde tu SelectorLib
        bytes4[] memory newSelectors = SelectorLib.getUniversityFacetSelectors();

        // 4. Cut limpio: REMOVE → ADD (NO REPLACE)
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](2);

        // 🔴 Remove viejo
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(0), action: IDiamondCut.FacetCutAction.Remove, functionSelectors: oldSelectors
        });

        // 🟢 Add nuevo limpio
        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(uf), action: IDiamondCut.FacetCutAction.Add, functionSelectors: newSelectors
        });

        // 5. Ejecutar
        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        vm.stopBroadcast();
    }
}
