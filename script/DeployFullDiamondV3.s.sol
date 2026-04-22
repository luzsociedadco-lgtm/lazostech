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
    // Usamos un array dinámico para acumular todos los cortes necesarios
    IDiamondCut.FacetCut[] finalCuts;

    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        loupe = IDiamondLoupe(diamond);

        vm.startBroadcast();

        // Procesar cada faceta una por una
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

        // Ejecutar la actualización con todos los cortes acumulados
        IDiamondCut(diamond).diamondCut(finalCuts, address(0), "");

        vm.stopBroadcast();
    }

    /// @dev Separa los selectores en ADD o REPLACE y los añade al array global de cortes
    function processFacet(address facetAddress, bytes4[] memory selectors) internal {
        uint256 len = selectors.length;
        bytes4[] memory addSelectors = new bytes4[](len);
        bytes4[] memory replaceSelectors = new bytes4[](len);
        uint256 addCount = 0;
        uint256 replaceCount = 0;

        for (uint256 i = 0; i < len; i++) {
            if (loupe.facetAddress(selectors[i]) == address(0)) {
                addSelectors[addCount] = selectors[i];
                addCount++;
            } else {
                replaceSelectors[replaceCount] = selectors[i];
                replaceCount++;
            }
        }

        // Si hay selectores para añadir, crear un FacetCut de ADD
        if (addCount > 0) {
            bytes4[] memory trimAdd = new bytes4[](addCount);
            for (uint256 j = 0; j < addCount; j++) {
                trimAdd[j] = addSelectors[j];
            }
            finalCuts.push(IDiamondCut.FacetCut(facetAddress, IDiamondCut.FacetCutAction.Add, trimAdd));
        }

        // Si hay selectores para reemplazar, crear un FacetCut de REPLACE
        if (replaceCount > 0) {
            bytes4[] memory trimReplace = new bytes4[](replaceCount);
            for (uint256 j = 0; j < replaceCount; j++) {
                trimReplace[j] = replaceSelectors[j];
            }
            finalCuts.push(IDiamondCut.FacetCut(facetAddress, IDiamondCut.FacetCutAction.Replace, trimReplace));
        }
    }
}
