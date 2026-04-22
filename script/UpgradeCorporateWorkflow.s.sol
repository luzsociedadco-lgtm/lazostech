// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {CorporateGovernanceFacet} from "src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol";
import {
    CorporateGovernanceViewFacet
} from "src/facets/governance/corporate-governance/CorporateGovernanceViewFacet.sol";
import {UniversityGovernanceFacet} from "src/facets/governance/university-governance/UniversityGovernanceFacet.sol";
import {
    UniversityGovernanceViewFacet
} from "src/facets/governance/university-governance/UniversityGovernanceViewFacet.sol";

interface IDiamondLoupeLike {
    function facetAddress(bytes4 _selector) external view returns (address);
}

contract UpgradeCorporateWorkflow is Script {
    struct SelectorBuckets {
        bytes4[] add;
        bytes4[] replace;
    }

    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        CorporateGovernanceFacet governanceFacet = new CorporateGovernanceFacet();
        CorporateGovernanceViewFacet governanceViewFacet = new CorporateGovernanceViewFacet();
        UniversityGovernanceFacet universityFacet = new UniversityGovernanceFacet();
        UniversityGovernanceViewFacet universityViewFacet = new UniversityGovernanceViewFacet();

        SelectorBuckets memory gov = _bucketSelectors(diamond, _corporateSelectors());
        SelectorBuckets memory govView = _bucketSelectors(diamond, _corporateViewSelectors());
        SelectorBuckets memory universityRestore = _replaceOnly(_universitySharedSelectors());
        SelectorBuckets memory universityViewRestore = _replaceOnly(_universitySharedViewSelectors());

        uint256 cutCount =
            _countCuts(gov) + _countCuts(govView) + _countCuts(universityRestore) + _countCuts(universityViewRestore);
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](cutCount);
        uint256 idx = 0;

        idx = _pushCuts(cut, idx, address(governanceFacet), gov);
        idx = _pushCuts(cut, idx, address(governanceViewFacet), govView);
        idx = _pushCuts(cut, idx, address(universityFacet), universityRestore);
        _pushCuts(cut, idx, address(universityViewFacet), universityViewRestore);

        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        console.log("CorporateGovernanceFacet:", address(governanceFacet));
        console.log("CorporateGovernanceViewFacet:", address(governanceViewFacet));
        console.log("UniversityGovernanceFacet:", address(universityFacet));
        console.log("UniversityGovernanceViewFacet:", address(universityViewFacet));

        vm.stopBroadcast();
    }

    function _corporateSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](17);
        selectors[0] = CorporateGovernanceFacet.initDao.selector;
        selectors[1] = CorporateGovernanceFacet.setChairperson.selector;
        selectors[2] = CorporateGovernanceFacet.setSecretary.selector;
        selectors[3] = CorporateGovernanceFacet.addBoardMember.selector;
        selectors[4] = CorporateGovernanceFacet.openSession.selector;
        selectors[5] = CorporateGovernanceFacet.joinSession.selector;
        selectors[6] = CorporateGovernanceFacet.leaveSession.selector;
        selectors[7] = CorporateGovernanceFacet.createResolution.selector;
        selectors[8] = CorporateGovernanceFacet.startDeliberation.selector;
        selectors[9] = CorporateGovernanceFacet.startVoting.selector;
        selectors[10] = CorporateGovernanceFacet.vote.selector;
        selectors[11] = CorporateGovernanceFacet.closeResolution.selector;
        selectors[12] = CorporateGovernanceFacet.assignCorporateExecutor.selector;
        selectors[13] = CorporateGovernanceFacet.closeSession.selector;
        selectors[14] = CorporateGovernanceFacet.executeResolution.selector;
        selectors[15] = CorporateGovernanceFacet.verifyResolution.selector;
        selectors[16] = CorporateGovernanceFacet.setGovernanceExecutor.selector;
    }

    function _corporateViewSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](5);
        selectors[0] = CorporateGovernanceViewFacet.getCorporateResolutionCount.selector;
        selectors[1] = CorporateGovernanceViewFacet.getCorporateResolution.selector;
        selectors[2] = CorporateGovernanceViewFacet.isCorporateActiveMember.selector;
        selectors[3] = CorporateGovernanceViewFacet.getCorporateSessionState.selector;
        selectors[4] = CorporateGovernanceViewFacet.getCorporateExecutionTask.selector;
    }

    function _universitySharedSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](1);
        selectors[0] = UniversityGovernanceFacet.assignExecutor.selector;
    }

    function _universitySharedViewSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](5);
        selectors[0] = UniversityGovernanceViewFacet.getResolutionCount.selector;
        selectors[1] = UniversityGovernanceViewFacet.getResolution.selector;
        selectors[2] = UniversityGovernanceViewFacet.isActiveMember.selector;
        selectors[3] = UniversityGovernanceViewFacet.getSessionState.selector;
        selectors[4] = UniversityGovernanceViewFacet.getExecutionTask.selector;
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

    function _replaceOnly(bytes4[] memory selectors) internal pure returns (SelectorBuckets memory buckets) {
        buckets.replace = selectors;
        buckets.add = new bytes4[](0);
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
