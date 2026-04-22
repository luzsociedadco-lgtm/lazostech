// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {IDiamondLoupe} from "src/interfaces/diamond/IDiamondLoupe.sol";
import {SelectorLib} from "src/diamond/SelectorLib.sol";

// Core
import {DiamondLoupeFacet} from "src/facets/core/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";

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

contract DeployFullDiamondV3 is Script {
    IDiamondLoupe loupe;
    address diamond;

    function run() external {
        diamond = vm.envAddress("DIAMOND");
        loupe = IDiamondLoupe(diamond);

        vm.startBroadcast();

        processFacet(address(new DiamondLoupeFacet()), SelectorLib.getDiamondLoupeFacetSelectors());
        processFacet(address(new OwnershipFacet()), SelectorLib.getOwnershipFacetSelectors());
        processFacet(address(new ParticipationFacet()), SelectorLib.getParticipationFacetSelectors());
        processFacet(address(new RewardFacet()), SelectorLib.getRewardFacetSelectors());
        processFacet(address(new TicketsFacet()), SelectorLib.getTicketsFacetSelectors());
        processFacet(address(new TreasuryFacet()), SelectorLib.getTreasuryFacetSelectors());
        processFacet(address(new MarketplaceFacet()), SelectorLib.getMarketplaceFacetSelectors());
        processFacet(address(new CorporateGovernanceFacet()), SelectorLib.getCorporateGovernanceFacetSelectors());
        processFacet(address(new UniversityGovernanceFacet()), SelectorLib.getUniversityGovernanceFacetSelectors());
        processFacet(address(new GovernanceRolesViewFacet()), SelectorLib.getGovernanceRolesViewFacetSelectors());
        processFacet(
            address(new CorporateGovernanceViewFacet()), SelectorLib.getCorporateGovernanceViewFacetSelectors()
        );
        processFacet(
            address(new UniversityGovernanceViewFacet()), SelectorLib.getUniversityGovernanceViewFacetSelectors()
        );
        processFacet(address(new CampusFacet()), SelectorLib.getCampusFacetSelectors());
        processFacet(address(new ProgramFacet()), SelectorLib.getProgramFacetSelectors());
        processFacet(address(new RecycleFacet()), SelectorLib.getRecycleFacetSelectors());
        processFacet(address(new UniversityFacet()), SelectorLib.getUniversityFacetSelectors());
        processFacet(address(new ImpactLeaderboardFacet()), SelectorLib.getImpactLeaderboardFacetSelectors());
        processFacet(address(new ImpactFacet()), SelectorLib.getImpactFacetSelectors());
        processFacet(address(new ImpactCredentialFacet()), SelectorLib.getImpactCredentialFacetSelectors());
        processFacet(address(new MachineFacet()), SelectorLib.getMachineFacetSelectors());
        processFacet(address(new ProfileFacet()), SelectorLib.getProfileFacetSelectors());

        vm.stopBroadcast();
    }

    function processFacet(address facetAddress, bytes4[] memory selectors) internal {
        uint256 len = selectors.length;
        bytes4[] memory addSelectors = new bytes4[](len);
        bytes4[] memory replaceSelectors = new bytes4[](len);

        (uint256 addCount, uint256 replaceCount) = classifySelectors(selectors, addSelectors, replaceSelectors);

        executeCutIfNeeded(facetAddress, IDiamondCut.FacetCutAction.Add, addSelectors, addCount);
        executeCutIfNeeded(facetAddress, IDiamondCut.FacetCutAction.Replace, replaceSelectors, replaceCount);
    }

    function classifySelectors(
        bytes4[] memory selectors,
        bytes4[] memory addSelectors,
        bytes4[] memory replaceSelectors
    ) internal view returns (uint256 addCount, uint256 replaceCount) {
        uint256 len = selectors.length;

        for (uint256 i = 0; i < len; i++) {
            bytes4 selector = selectors[i];

            if (loupe.facetAddress(selector) == address(0)) {
                addSelectors[addCount] = selector;
                addCount++;
            } else {
                replaceSelectors[replaceCount] = selector;
                replaceCount++;
            }
        }
    }

    function executeCutIfNeeded(
        address facetAddress,
        IDiamondCut.FacetCutAction action,
        bytes4[] memory selectors,
        uint256 count
    ) internal {
        if (count == 0) return;

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut(facetAddress, action, trimSelectors(selectors, count));

        IDiamondCut(diamond).diamondCut(cuts, address(0), "");
    }

    function trimSelectors(bytes4[] memory selectors, uint256 count) internal pure returns (bytes4[] memory trimmed) {
        trimmed = new bytes4[](count);

        for (uint256 i = 0; i < count; i++) {
            trimmed[i] = selectors[i];
        }
    }
}
