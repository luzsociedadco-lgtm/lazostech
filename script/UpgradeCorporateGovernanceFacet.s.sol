// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IDiamondCut} from "../src/interfaces/diamond/IDiamondCut.sol";
import {CorporateGovernanceFacet} from "../src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol";

contract UpgradeCorporateGovernanceFacet is Script {
    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        // 1. Desplegar la faceta (asegúrate de que el .sol tenga la función setGovernanceExecutor)
        CorporateGovernanceFacet facet = new CorporateGovernanceFacet();

        // 2. Definir el selector (Array de tamaño 1)
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = CorporateGovernanceFacet.setGovernanceExecutor.selector;

        // 3. Configurar el Cut
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(facet),
            action: IDiamondCut.FacetCutAction.Add, // Usa Add si es la primera vez que la subes
            functionSelectors: selectors
        });

        // 4. Ejecutar el Cut en el Diamond
        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        vm.stopBroadcast();
    }
}
