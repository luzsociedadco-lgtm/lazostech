// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {SelectorLib} from "src/diamond/SelectorLib.sol";

import {CorporateGovernanceFacet} from "src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol";
import {UniversityGovernanceFacet} from "src/facets/governance/university-governance/UniversityGovernanceFacet.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";

import {GovernanceRolesViewFacet} from "src/facets/governance/corporate-governance/GovernanceRolesViewFacet.sol";
import {CorporateGovernanceViewFacet} from "src/facets/governance/corporate-governance/CorporateGovernanceViewFacet.sol";
import {UniversityGovernanceViewFacet} from "src/facets/governance/university-governance/UniversityGovernanceViewFacet.sol";

contract DeployFullDiamondV2 is Script {
    function run() external {
        address diamond = vm.envAddress("DIAMOND");

        vm.startBroadcast();

        CorporateGovernanceFacet corporateFacet = new CorporateGovernanceFacet();
        UniversityGovernanceFacet universityFacet = new UniversityGovernanceFacet();
        RewardFacet rewardFacet = new RewardFacet();
        RecycleFacet recycleFacet = new RecycleFacet();

        GovernanceRolesViewFacet rolesViewFacet = new GovernanceRolesViewFacet();
        CorporateGovernanceViewFacet corporateViewFacet = new CorporateGovernanceViewFacet();
        UniversityGovernanceViewFacet universityViewFacet = new UniversityGovernanceViewFacet();

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](6);

        // 1. CorporateGovernance: El anterior tenía 8 Replace y 6 Add. 
        // Para el Diamond, los 14 ya existen ahora, así que podemos usar Replace para todos.
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(corporateFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: SelectorLib.getCorporateGovernanceFacetSelectors()
        });

        // 2. UniversityGovernance: En el anterior lo pusiste como ADD. 
        // Como ya se subió, ahora debe ser REPLACE.
        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(universityFacet),
            action: IDiamondCut.FacetCutAction.Replace, 
            functionSelectors: SelectorLib.getUniversityGovernanceFacetSelectors()
        });

        // 3. RewardFacet: Eran 7 Replace. Siguen siendo REPLACE.
        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(rewardFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: SelectorLib.getRewardFacetSelectors()
        });

        // 4. GovernanceRolesViewFacet: Antes ADD -> Ahora REPLACE.
        cut[3] = IDiamondCut.FacetCut({
            facetAddress: address(rolesViewFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: SelectorLib.getGovernanceRolesViewFacetSelectors()
        });

        // 5. CorporateGovernanceViewFacet: Antes ADD -> Ahora REPLACE.
        cut[4] = IDiamondCut.FacetCut({
            facetAddress: address(corporateViewFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: SelectorLib.getCorporateGovernanceViewFacetSelectors()
        });

        // 6. UniversityGovernanceViewFacet: Antes ADD -> Ahora REPLACE.
        cut[5] = IDiamondCut.FacetCut({
            facetAddress: address(universityViewFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: SelectorLib.getUniversityGovernanceViewFacetSelectors()
        });


        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        vm.stopBroadcast();
    }
}
