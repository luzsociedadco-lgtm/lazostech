// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {TreasuryFacet} from "src/facets/economy/TreasuryFacet.sol";

interface ILegacyDiamondLoupe {
    function facetAddress(bytes4 _selector) external view returns (address);
}

contract UpgradeLegacyTreasuryRescue is Script {
    function run() external {
        address diamond = vm.envAddress("LEGACY_DIAMOND");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        TreasuryFacet facet = new TreasuryFacet();

        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = TreasuryFacet.withdrawTokens.selector;

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(facet),
            action: ILegacyDiamondLoupe(diamond).facetAddress(selectors[0]) == address(0)
                ? IDiamondCut.FacetCutAction.Add
                : IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        console.log("Legacy treasury rescue facet deployed at:", address(facet));
        vm.stopBroadcast();
    }
}
