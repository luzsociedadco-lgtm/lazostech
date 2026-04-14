// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IDiamondCut} from "../src/interfaces/diamond/IDiamondCut.sol";
import {TreasuryFacet} from "../src/facets/economy/TreasuryFacet.sol";

contract UpgradeTreasuryFacet is Script {
    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        // 1. Desplegar el nuevo contrato (Facet)
        TreasuryFacet facet = new TreasuryFacet();

        // --- PREPARACIÓN DE SELECTORES ---

        // Selectores que se mantienen pero cambian de lógica (REPLACE)
        bytes4[] memory replaceSelectors = new bytes4[](1);
        replaceSelectors[0] = TreasuryFacet.treasuryBalance.selector;

        // Selectores que son nuevos (ADD)
        // Nota: Si treasuryExecute ya existía antes, muévelo al array de Replace
        bytes4[] memory addSelectors = new bytes4[](1);
        addSelectors[0] = TreasuryFacet.treasuryExecute.selector;

        // Selector antiguo a ELIMINAR (REMOVE)
        // Importante: Como ya lo borraste del .sol, lo calculamos manualmente
        bytes4[] memory removeSelectors = new bytes4[](1);
        removeSelectors[0] = bytes4(keccak256("treasuryWithdraw(address,uint256)"));

        // --- CONFIGURACIÓN DEL DIAMOND CUT ---

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](3);

        // Acción: REPLACE (Actualiza el balance)
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(facet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: replaceSelectors
        });

        // Acción: ADD (Añade el nuevo execute)
        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(facet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: addSelectors
        });

        // Acción: REMOVE (Borra el withdraw viejo)
        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(0), // Siempre address(0) para borrar
            action: IDiamondCut.FacetCutAction.Remove,
            functionSelectors: removeSelectors
        });

        // 4. Ejecutar el Diamond Cut
        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        vm.stopBroadcast();
    }
}
