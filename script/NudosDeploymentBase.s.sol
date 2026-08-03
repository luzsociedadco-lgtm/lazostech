// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {NudosFacetCutFactory} from "src/diamond/NudosFacetCutFactory.sol";
import {Diamond} from "src/diamond/Diamond.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {DiamondCutFacet} from "src/facets/core/DiamondCutFacet.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";
import {DiamondInit} from "src/init/DiamondInit.sol";

abstract contract NudosDeploymentBase is Script {
    function _deployNudosDiamond(address deploymentOwner, address finalOwner) internal returns (Diamond diamond) {
        require(deploymentOwner != address(0), "Deploy: zero deployment owner");
        require(finalOwner != address(0), "Deploy: zero final owner");
        require(msg.sender == deploymentOwner, "Deploy: sender does not match DEPLOYER_ADDRESS");

        vm.startBroadcast();

        DiamondCutFacet cutFacet = new DiamondCutFacet();
        diamond = new Diamond(deploymentOwner, address(cutFacet));
        DiamondInit init = new DiamondInit();
        NudosFacetCutFactory factory = new NudosFacetCutFactory();

        IDiamondCut.FacetCut[] memory cut = factory.deployFacets();
        IDiamondCut(address(diamond)).diamondCut(cut, address(init), abi.encodeCall(DiamondInit.init, ()));

        if (finalOwner != deploymentOwner) {
            OwnershipFacet(address(diamond)).transferOwnership(finalOwner);
        }

        require(OwnershipFacet(address(diamond)).owner() == finalOwner, "Deploy: ownership transfer failed");

        vm.stopBroadcast();

        console2.log("NUDOS DIAMOND DEPLOYED AT:", address(diamond));
        console2.log("NUDOS DIAMOND OWNER:", finalOwner);
    }
}
