// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {SelectorLib} from "src/diamond/SelectorLib.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";

interface IDiamond {
    function facetAddress(bytes4 _functionSelector) external view returns (address);
}

contract UpgradeRecycle is Script {
    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        vm.startBroadcast();

        // 1. Desplegar la nueva versión
        RecycleFacet newRecycle = new RecycleFacet();
        bytes4[] memory allSelectors = SelectorLib.getRecycleFacetSelectors();

        // 2. Clasificar selectores
        uint256 countReplace = 0;
        for (uint i = 0; i < allSelectors.length; i++) {
            if (IDiamond(diamond).facetAddress(allSelectors[i]) != address(0)) {
                countReplace++;
            }
        }

        bytes4[] memory toReplace = new bytes4[](countReplace);
        bytes4[] memory toAdd = new bytes4[](allSelectors.length - countReplace);

        uint256 rIdx = 0;
        uint256 aIdx = 0;
        for (uint i = 0; i < allSelectors.length; i++) {
            if (IDiamond(diamond).facetAddress(allSelectors[i]) != address(0)) {
                toReplace[rIdx++] = allSelectors[i];
            } else {
                toAdd[aIdx++] = allSelectors[i];
            }
        }

        // 3. Preparar el corte
        uint256 cutSize = (toAdd.length > 0 && toReplace.length > 0) ? 2 : 1;
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](cutSize);

        uint256 currentCutIdx = 0;
        if (toReplace.length > 0) {
            cut[currentCutIdx++] = IDiamondCut.FacetCut({
                facetAddress: address(newRecycle),
                action: IDiamondCut.FacetCutAction.Replace,
                functionSelectors: toReplace
            });
        }
        if (toAdd.length > 0) {
            cut[currentCutIdx] = IDiamondCut.FacetCut({
                facetAddress: address(newRecycle),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: toAdd
            });
        }

        // 4. Ejecutar
        IDiamondCut(diamond).diamondCut(cut, address(0), "");
        
        console.log("Upgrade Recycle completado.");
        console.log("Nueva Facet en:", address(newRecycle));
        console.log("Selectores reemplazados:", toReplace.length);
        console.log("Selectores agregados:", toAdd.length);

        vm.stopBroadcast();
    }
}
