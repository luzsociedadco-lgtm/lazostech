// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IDiamondCut} from "../src/interfaces/diamond/IDiamondCut.sol";
import {RewardFacet} from "../src/facets/economy/RewardFacet.sol";

contract UpgradeRewardFacet is Script {
    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        RewardFacet facet = new RewardFacet();

        // Ahora las 8 funciones ya existen, así que todas van a REPLACE
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = RewardFacet.setRewardToken.selector;
        selectors[1] = RewardFacet.setRecycleRate.selector;
        selectors[2] = RewardFacet.grantReward.selector;
        selectors[3] = RewardFacet.getRewardToken.selector;
        selectors[4] = RewardFacet.getRecycleRate.selector;
        selectors[5] = RewardFacet.getNudos.selector;
        selectors[6] = RewardFacet.getNudosAccumulated.selector;

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(facet),
            action: IDiamondCut.FacetCutAction.Replace, // Solo Replace
            functionSelectors: selectors
        });

        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        vm.stopBroadcast();
    }
}
