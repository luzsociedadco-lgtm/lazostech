// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {SelectorLib} from "src/diamond/SelectorLib.sol";
import {Diamond} from "src/diamond/Diamond.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {DiamondCutFacet} from "src/facets/core/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "src/facets/core/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";
import {DiamondInit} from "src/init/DiamondInit.sol";

// LazosTech facets
import {ParticipationFacet} from "src/facets/economy/ParticipationFacet.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";
import {MarketplaceFacet} from "src/facets/marketplace/MarketplaceFacet.sol";
import {CorporateGovernanceFacet} from "../src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol";
import {CampusFacet} from "src/facets/recycling/CampusFacet.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";
import {UniversityFacet} from "src/facets/recycling/UniversityFacet.sol";
import {ImpactLeaderboardFacet} from "src/facets/impact/ImpactLeaderboardFacet.sol";
import {MachineFacet} from "src/facets/machines/MachineFacet.sol";
import {ProfileFacet} from "src/facets/profile/ProfileFacet.sol";

contract DeployFullDiamond is Script {
    function run() external {
        vm.startBroadcast();

        // 1️⃣ & 2️⃣ Core Deployment
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        Diamond diamond = new Diamond(msg.sender, address(diamondCutFacet));
        DiamondInit diamondInit = new DiamondInit();

        // 3️⃣ Preparar el array de cortes
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](13);

        // Bloque A: Core Facets (Liberamos stack al terminar el bloque)
        {
            cut[0] = IDiamondCut.FacetCut({
                facetAddress: address(new DiamondLoupeFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getDiamondLoupeFacetSelectors()
            });

            cut[1] = IDiamondCut.FacetCut({
                facetAddress: address(new OwnershipFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getOwnershipFacetSelectors()
            });
        }

        // Bloque B: Economy Facets
        {
            cut[2] = IDiamondCut.FacetCut({
                facetAddress: address(new ParticipationFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getParticipationFacetSelectors()
            });

            cut[3] = IDiamondCut.FacetCut({
                facetAddress: address(new RewardFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getRewardFacetSelectors()
            });

            cut[4] = IDiamondCut.FacetCut({
                facetAddress: address(new TicketsFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getTicketsFacetSelectors()
            });
        }

        // Bloque C: Governance & Marketplace
        {
            cut[5] = IDiamondCut.FacetCut({
                facetAddress: address(new MarketplaceFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getMarketplaceFacetSelectors()
            });

            cut[6] = IDiamondCut.FacetCut({
                facetAddress: address(new CorporateGovernanceFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getCorporateGovernanceFacetSelectors()
            });
        }

        // Bloque D: Recycling Facets
        {
            cut[7] = IDiamondCut.FacetCut({
                facetAddress: address(new CampusFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getCampusFacetSelectors()
            });

            cut[8] = IDiamondCut.FacetCut({
                facetAddress: address(new RecycleFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getRecycleFacetSelectors()
            });

            cut[9] = IDiamondCut.FacetCut({
                facetAddress: address(new UniversityFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getUniversityFacetSelectors()
            });
        }

        // Bloque E: Impact, Machines & Profile
        {
            cut[10] = IDiamondCut.FacetCut({
                facetAddress: address(new ImpactLeaderboardFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getImpactLeaderboardFacetSelectors()
            });

            cut[11] = IDiamondCut.FacetCut({
                facetAddress: address(new MachineFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getMachineFacetSelectors()
            });

            cut[12] = IDiamondCut.FacetCut({
                facetAddress: address(new ProfileFacet()),
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: SelectorLib.getProfileFacetSelectors()
            });
        }

        // 6️⃣ Ejecutar Diamond Cut con el stack ya limpio
        IDiamondCut(address(diamond)).diamondCut(
            cut,
            address(diamondInit),
            abi.encodeWithSelector(DiamondInit.init.selector)
        );

        vm.stopBroadcast();

        console2.log("DIAMOND DEPLOYED AT:", address(diamond));
    }
}
