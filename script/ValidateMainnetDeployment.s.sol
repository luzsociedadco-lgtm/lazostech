// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {IDiamondLoupe} from "src/interfaces/diamond/IDiamondLoupe.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";

/// @notice Read-only post-deployment assertions for the production Diamond.
contract ValidateMainnetDeployment is Script {
    uint256 internal constant BASE_MAINNET_CHAIN_ID = 8_453;
    uint256 internal constant EXPECTED_FACET_COUNT = 22;
    uint256 internal constant EXPECTED_SELECTOR_COUNT = 149;

    function run() external view {
        require(block.chainid == BASE_MAINNET_CHAIN_ID, "Validate: wrong chain");

        address diamond = vm.envAddress("DIAMOND");
        address token = vm.envAddress("NUDOS_TOKEN");
        address expectedOwner = vm.envAddress("DIAMOND_OWNER");

        require(diamond.code.length > 0, "Validate: Diamond has no code");
        require(token.code.length > 0, "Validate: token has no code");
        require(OwnershipFacet(diamond).owner() == expectedOwner, "Validate: wrong Diamond owner");
        require(RewardFacet(diamond).getRewardToken() == token, "Validate: reward token not configured");
        require(TicketsFacet(diamond).quoteTicketRedemption(1) > 0, "Validate: ticket quote not initialized");

        IDiamondLoupe loupe = IDiamondLoupe(diamond);
        address[] memory facets = loupe.facetAddresses();
        require(facets.length == EXPECTED_FACET_COUNT, "Validate: wrong facet count");

        uint256 selectorCount;
        for (uint256 i; i < facets.length; ++i) {
            selectorCount += loupe.facetFunctionSelectors(facets[i]).length;
        }
        require(selectorCount == EXPECTED_SELECTOR_COUNT, "Validate: wrong selector count");

        console2.log("VALIDATED DIAMOND:", diamond);
        console2.log("VALIDATED TOKEN:", token);
        console2.log("VALIDATED OWNER:", expectedOwner);
        console2.log("FACETS:", facets.length);
        console2.log("SELECTORS:", selectorCount);
    }
}
