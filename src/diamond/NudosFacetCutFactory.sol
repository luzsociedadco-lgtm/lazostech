// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {SelectorLib} from "src/diamond/SelectorLib.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {DiamondLoupeFacet} from "src/facets/core/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";
import {ParticipationFacet} from "src/facets/economy/ParticipationFacet.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";
import {TreasuryFacet} from "src/facets/economy/TreasuryFacet.sol";
import {MarketplaceFacet} from "src/facets/marketplace/MarketplaceFacet.sol";
import {CorporateGovernanceFacet} from "src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol";
import {UniversityGovernanceFacet} from "src/facets/governance/university-governance/UniversityGovernanceFacet.sol";
import {GovernanceRolesViewFacet} from "src/facets/governance/corporate-governance/GovernanceRolesViewFacet.sol";
import {
    CorporateGovernanceViewFacet
} from "src/facets/governance/corporate-governance/CorporateGovernanceViewFacet.sol";
import {
    UniversityGovernanceViewFacet
} from "src/facets/governance/university-governance/UniversityGovernanceViewFacet.sol";
import {CampusFacet} from "src/facets/recycling/CampusFacet.sol";
import {ProgramFacet} from "src/facets/recycling/ProgramFacet.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";
import {UniversityFacet} from "src/facets/recycling/UniversityFacet.sol";
import {ImpactLeaderboardFacet} from "src/facets/impact/ImpactLeaderboardFacet.sol";
import {ImpactFacet} from "src/facets/impact/ImpactFacet.sol";
import {ImpactCredentialFacet} from "src/facets/impact/ImpactCredentialFacet.sol";
import {MachineFacet} from "src/facets/machines/MachineFacet.sol";
import {ProfileFacet} from "src/facets/profile/ProfileFacet.sol";

/// @notice Builds the canonical 21-facet cut used by deployment scripts and integration tests.
/// @dev Kept internal so the combined facet creation code is never deployed as an EIP-170-limited contract.
library NudosFacetCutFactory {
    uint256 public constant FACET_COUNT = 21;

    function deployFacets() internal returns (IDiamondCut.FacetCut[] memory cut) {
        cut = new IDiamondCut.FacetCut[](FACET_COUNT);

        cut[0] = _add(address(new DiamondLoupeFacet()), SelectorLib.getDiamondLoupeFacetSelectors());
        cut[1] = _add(address(new OwnershipFacet()), SelectorLib.getOwnershipFacetSelectors());
        cut[2] = _add(address(new ParticipationFacet()), SelectorLib.getParticipationFacetSelectors());
        cut[3] = _add(address(new RewardFacet()), SelectorLib.getRewardFacetSelectors());
        cut[4] = _add(address(new TicketsFacet()), SelectorLib.getTicketsFacetSelectors());
        cut[5] = _add(address(new TreasuryFacet()), SelectorLib.getTreasuryFacetSelectors());
        cut[6] = _add(address(new MarketplaceFacet()), SelectorLib.getMarketplaceFacetSelectors());
        cut[7] = _add(address(new CorporateGovernanceFacet()), SelectorLib.getCorporateGovernanceFacetSelectors());
        cut[8] = _add(address(new UniversityGovernanceFacet()), SelectorLib.getUniversityGovernanceFacetSelectors());
        cut[9] = _add(address(new GovernanceRolesViewFacet()), SelectorLib.getGovernanceRolesViewFacetSelectors());
        cut[10] =
            _add(address(new CorporateGovernanceViewFacet()), SelectorLib.getCorporateGovernanceViewFacetSelectors());
        cut[11] =
            _add(address(new UniversityGovernanceViewFacet()), SelectorLib.getUniversityGovernanceViewFacetSelectors());
        cut[12] = _add(address(new CampusFacet()), SelectorLib.getCampusFacetSelectors());
        cut[13] = _add(address(new ProgramFacet()), SelectorLib.getProgramFacetSelectors());
        cut[14] = _add(address(new RecycleFacet()), SelectorLib.getRecycleFacetSelectors());
        cut[15] = _add(address(new UniversityFacet()), SelectorLib.getUniversityFacetSelectors());
        cut[16] = _add(address(new ImpactLeaderboardFacet()), SelectorLib.getImpactLeaderboardFacetSelectors());
        cut[17] = _add(address(new ImpactFacet()), SelectorLib.getImpactFacetSelectors());
        cut[18] = _add(address(new ImpactCredentialFacet()), SelectorLib.getImpactCredentialFacetSelectors());
        cut[19] = _add(address(new MachineFacet()), SelectorLib.getMachineFacetSelectors());
        cut[20] = _add(address(new ProfileFacet()), SelectorLib.getProfileFacetSelectors());
    }

    function _add(address facet, bytes4[] memory selectors) private pure returns (IDiamondCut.FacetCut memory cut) {
        require(facet != address(0), "NudosFacetCutFactory: zero facet");
        require(selectors.length != 0, "NudosFacetCutFactory: no selectors");
        cut = IDiamondCut.FacetCut({
            facetAddress: facet, action: IDiamondCut.FacetCutAction.Add, functionSelectors: selectors
        });
    }
}
