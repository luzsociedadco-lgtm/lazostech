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

// Economy
import {ParticipationFacet} from "src/facets/economy/ParticipationFacet.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";
import {TreasuryFacet} from "src/facets/economy/TreasuryFacet.sol";

// Marketplace
import {MarketplaceFacet} from "src/facets/marketplace/MarketplaceFacet.sol";

// Governance
import {CorporateGovernanceFacet} from "src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol";
import {UniversityGovernanceFacet} from "src/facets/governance/university-governance/UniversityGovernanceFacet.sol";
import {GovernanceRolesViewFacet} from "src/facets/governance/corporate-governance/GovernanceRolesViewFacet.sol";
import {
    CorporateGovernanceViewFacet
} from "src/facets/governance/corporate-governance/CorporateGovernanceViewFacet.sol";
import {
    UniversityGovernanceViewFacet
} from "src/facets/governance/university-governance/UniversityGovernanceViewFacet.sol";

// Recycling
import {CampusFacet} from "src/facets/recycling/CampusFacet.sol";
import {ProgramFacet} from "src/facets/recycling/ProgramFacet.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";
import {UniversityFacet} from "src/facets/recycling/UniversityFacet.sol";

// Impact
import {ImpactLeaderboardFacet} from "src/facets/impact/ImpactLeaderboardFacet.sol";
import {ImpactFacet} from "src/facets/impact/ImpactFacet.sol";
import {ImpactCredentialFacet} from "src/facets/impact/ImpactCredentialFacet.sol";

// Others
import {MachineFacet} from "src/facets/machines/MachineFacet.sol";
import {ProfileFacet} from "src/facets/profile/ProfileFacet.sol";

contract DeployPilotDiamond is Script {
    function run() external {
        vm.startBroadcast();

        DiamondCutFacet cutFacet = new DiamondCutFacet();
        Diamond diamond = new Diamond(msg.sender, address(cutFacet));
        DiamondInit init = new DiamondInit();

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](21);

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

        cut[5] = IDiamondCut.FacetCut({
            facetAddress: address(new TreasuryFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getTreasuryFacetSelectors()
        });

        cut[6] = IDiamondCut.FacetCut({
            facetAddress: address(new MarketplaceFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getMarketplaceFacetSelectors()
        });

        cut[7] = IDiamondCut.FacetCut({
            facetAddress: address(new CorporateGovernanceFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getCorporateGovernanceFacetSelectors()
        });

        cut[8] = IDiamondCut.FacetCut({
            facetAddress: address(new UniversityGovernanceFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getUniversityGovernanceFacetSelectors()
        });

        cut[9] = IDiamondCut.FacetCut({
            facetAddress: address(new GovernanceRolesViewFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getGovernanceRolesViewFacetSelectors()
        });

        cut[10] = IDiamondCut.FacetCut({
            facetAddress: address(new CorporateGovernanceViewFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getCorporateGovernanceViewFacetSelectors()
        });

        cut[11] = IDiamondCut.FacetCut({
            facetAddress: address(new UniversityGovernanceViewFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getUniversityGovernanceViewFacetSelectors()
        });

        cut[12] = IDiamondCut.FacetCut({
            facetAddress: address(new CampusFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getCampusFacetSelectors()
        });

        cut[13] = IDiamondCut.FacetCut({
            facetAddress: address(new ProgramFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getProgramFacetSelectors()
        });

        cut[14] = IDiamondCut.FacetCut({
            facetAddress: address(new RecycleFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getRecycleFacetSelectors()
        });

        cut[15] = IDiamondCut.FacetCut({
            facetAddress: address(new UniversityFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getUniversityFacetSelectors()
        });

        cut[16] = IDiamondCut.FacetCut({
            facetAddress: address(new ImpactLeaderboardFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getImpactLeaderboardFacetSelectors()
        });

        cut[17] = IDiamondCut.FacetCut({
            facetAddress: address(new ImpactFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getImpactFacetSelectors()
        });

        cut[18] = IDiamondCut.FacetCut({
            facetAddress: address(new ImpactCredentialFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getImpactCredentialFacetSelectors()
        });

        cut[19] = IDiamondCut.FacetCut({
            facetAddress: address(new MachineFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getMachineFacetSelectors()
        });

        cut[20] = IDiamondCut.FacetCut({
            facetAddress: address(new ProfileFacet()),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: SelectorLib.getProfileFacetSelectors()
        });

        IDiamondCut(address(diamond)).diamondCut(cut, address(init), abi.encodeWithSelector(DiamondInit.init.selector));

        vm.stopBroadcast();

        console2.log("PILOT DIAMOND DEPLOYED AT:", address(diamond));
    }
}
