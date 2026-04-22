// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {SelectorLib} from "src/diamond/SelectorLib.sol";
import {ProfileFacet} from "src/facets/profile/ProfileFacet.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";
import {UniversityGovernanceFacet} from "src/facets/governance/university-governance/UniversityGovernanceFacet.sol";
import {
    UniversityGovernanceViewFacet
} from "src/facets/governance/university-governance/UniversityGovernanceViewFacet.sol";

interface IDiamondLoupeLike {
    function facetAddress(bytes4 _selector) external view returns (address);
}

contract UpgradePilotWorkflow is Script {
    struct SelectorBuckets {
        bytes4[] add;
        bytes4[] replace;
    }

    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        ProfileFacet profileFacet = new ProfileFacet();
        RecycleFacet recycleFacet = new RecycleFacet();
        UniversityGovernanceFacet governanceFacet = new UniversityGovernanceFacet();
        UniversityGovernanceViewFacet governanceViewFacet = new UniversityGovernanceViewFacet();

        SelectorBuckets memory profile = _bucketSelectors(diamond, SelectorLib.getProfileFacetSelectors());
        SelectorBuckets memory recycle = _bucketSelectors(diamond, SelectorLib.getRecycleFacetSelectors());
        SelectorBuckets memory gov = _bucketSelectors(diamond, SelectorLib.getUniversityGovernanceFacetSelectors());
        SelectorBuckets memory govView =
            _bucketSelectors(diamond, SelectorLib.getUniversityGovernanceViewFacetSelectors());

        uint256 cutCount = _countCuts(profile) + _countCuts(recycle) + _countCuts(gov) + _countCuts(govView);

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](cutCount);
        uint256 idx = 0;

        idx = _pushCuts(cut, idx, address(profileFacet), profile);
        idx = _pushCuts(cut, idx, address(recycleFacet), recycle);
        idx = _pushCuts(cut, idx, address(governanceFacet), gov);
        _pushCuts(cut, idx, address(governanceViewFacet), govView);

        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        console.log("ProfileFacet:", address(profileFacet));
        console.log("RecycleFacet:", address(recycleFacet));
        console.log("UniversityGovernanceFacet:", address(governanceFacet));
        console.log("UniversityGovernanceViewFacet:", address(governanceViewFacet));

        vm.stopBroadcast();
    }

    function _bucketSelectors(address diamond, bytes4[] memory selectors)
        internal
        view
        returns (SelectorBuckets memory buckets)
    {
        uint256 replaceCount = 0;
        for (uint256 i = 0; i < selectors.length; i++) {
            if (IDiamondLoupeLike(diamond).facetAddress(selectors[i]) != address(0)) {
                replaceCount++;
            }
        }

        buckets.replace = new bytes4[](replaceCount);
        buckets.add = new bytes4[](selectors.length - replaceCount);

        uint256 r;
        uint256 a;
        for (uint256 i = 0; i < selectors.length; i++) {
            if (IDiamondLoupeLike(diamond).facetAddress(selectors[i]) != address(0)) {
                buckets.replace[r++] = selectors[i];
            } else {
                buckets.add[a++] = selectors[i];
            }
        }
    }

    function _countCuts(SelectorBuckets memory buckets) internal pure returns (uint256 count) {
        if (buckets.replace.length > 0) count++;
        if (buckets.add.length > 0) count++;
    }

    function _pushCuts(IDiamondCut.FacetCut[] memory cut, uint256 idx, address facet, SelectorBuckets memory buckets)
        internal
        pure
        returns (uint256)
    {
        if (buckets.replace.length > 0) {
            cut[idx++] = IDiamondCut.FacetCut({
                facetAddress: facet, action: IDiamondCut.FacetCutAction.Replace, functionSelectors: buckets.replace
            });
        }

        if (buckets.add.length > 0) {
            cut[idx++] = IDiamondCut.FacetCut({
                facetAddress: facet, action: IDiamondCut.FacetCutAction.Add, functionSelectors: buckets.add
            });
        }

        return idx;
    }
}
