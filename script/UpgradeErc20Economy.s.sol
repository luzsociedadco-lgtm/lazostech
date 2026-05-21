// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";
import {MarketplaceFacet} from "src/facets/marketplace/MarketplaceFacet.sol";
import {TreasuryFacet} from "src/facets/economy/TreasuryFacet.sol";
import {UniversityGovernanceFacet} from "src/facets/governance/university-governance/UniversityGovernanceFacet.sol";

interface IDiamondLoupeLike {
    function facetAddress(bytes4 _selector) external view returns (address);
}

contract UpgradeErc20Economy is Script {
    struct SelectorBuckets {
        bytes4[] add;
        bytes4[] replace;
    }

    function run() external {
        address diamond = vm.envAddress("DIAMOND");
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        RewardFacet rewardFacet = new RewardFacet();
        TicketsFacet ticketsFacet = new TicketsFacet();
        MarketplaceFacet marketplaceFacet = new MarketplaceFacet();
        TreasuryFacet treasuryFacet = new TreasuryFacet();
        UniversityGovernanceFacet universityFacet = new UniversityGovernanceFacet();

        SelectorBuckets memory reward = _bucketSelectors(diamond, _rewardSelectors());
        SelectorBuckets memory tickets = _bucketSelectors(diamond, _ticketsSelectors());
        SelectorBuckets memory marketplace = _bucketSelectors(diamond, _marketplaceSelectors());
        SelectorBuckets memory treasury = _bucketSelectors(diamond, _treasurySelectors());
        SelectorBuckets memory university = _replaceOnly(_universitySelectors());

        uint256 cutCount =
            _countCuts(reward) +
            _countCuts(tickets) +
            _countCuts(marketplace) +
            _countCuts(treasury) +
            _countCuts(university);

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](cutCount);
        uint256 idx = 0;

        idx = _pushCuts(cut, idx, address(rewardFacet), reward);
        idx = _pushCuts(cut, idx, address(ticketsFacet), tickets);
        idx = _pushCuts(cut, idx, address(marketplaceFacet), marketplace);
        idx = _pushCuts(cut, idx, address(treasuryFacet), treasury);
        _pushCuts(cut, idx, address(universityFacet), university);

        IDiamondCut(diamond).diamondCut(cut, address(0), "");

        console.log("RewardFacet:", address(rewardFacet));
        console.log("TicketsFacet:", address(ticketsFacet));
        console.log("MarketplaceFacet:", address(marketplaceFacet));
        console.log("TreasuryFacet:", address(treasuryFacet));
        console.log("UniversityGovernanceFacet:", address(universityFacet));

        vm.stopBroadcast();
    }

    function _rewardSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](10);
        selectors[0] = RewardFacet.setRewardToken.selector;
        selectors[1] = RewardFacet.setRecycleRate.selector;
        selectors[2] = RewardFacet.setRewardBaseUnit.selector;
        selectors[3] = RewardFacet.grantReward.selector;
        selectors[4] = RewardFacet.getRewardToken.selector;
        selectors[5] = RewardFacet.getRecycleRate.selector;
        selectors[6] = RewardFacet.getNudos.selector;
        selectors[7] = RewardFacet.getNudosAccumulated.selector;
        selectors[8] = RewardFacet.getRewardBaseUnit.selector;
        selectors[9] = RewardFacet.getRewardTreasuryBalance.selector;
    }

    function _ticketsSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](8);
        selectors[0] = TicketsFacet.getTickets.selector;
        selectors[1] = TicketsFacet.mintTicket.selector;
        selectors[2] = TicketsFacet.redeemTickets.selector;
        selectors[3] = TicketsFacet.transferTicket.selector;
        selectors[4] = TicketsFacet.useTicket.selector;
        selectors[5] = TicketsFacet.grantTicketsFromFiat.selector;
        selectors[6] = TicketsFacet.redeemTicketsForOrder.selector;
        selectors[7] = TicketsFacet.quoteTicketRedemption.selector;
    }

    function _marketplaceSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](11);
        selectors[0] = MarketplaceFacet.acceptTrade.selector;
        selectors[1] = MarketplaceFacet.buyWithTokens.selector;
        selectors[2] = MarketplaceFacet.createItem.selector;
        selectors[3] = MarketplaceFacet.getItem.selector;
        selectors[4] = MarketplaceFacet.listItem.selector;
        selectors[5] = MarketplaceFacet.proposeTrade.selector;
        selectors[6] = MarketplaceFacet.rateItem.selector;
        selectors[7] = MarketplaceFacet.executeMarketplaceFee.selector;
        selectors[8] = MarketplaceFacet.spendTreasury.selector;
        selectors[9] = MarketplaceFacet.settleMarketplacePurchase.selector;
        selectors[10] = MarketplaceFacet.collectMarketplaceFee.selector;
    }

    function _treasurySelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](3);
        selectors[0] = TreasuryFacet.treasuryExecute.selector;
        selectors[1] = TreasuryFacet.treasuryBalance.selector;
        selectors[2] = TreasuryFacet.withdrawTokens.selector;
    }

    function _universitySelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](14);
        selectors[0] = UniversityGovernanceFacet.initUniversityDao.selector;
        selectors[1] = UniversityGovernanceFacet.addMember.selector;
        selectors[2] = UniversityGovernanceFacet.openUniversitySession.selector;
        selectors[3] = UniversityGovernanceFacet.joinUniversitySession.selector;
        selectors[4] = UniversityGovernanceFacet.leaveUniversitySession.selector;
        selectors[5] = UniversityGovernanceFacet.createUniversityResolution.selector;
        selectors[6] = UniversityGovernanceFacet.startUniversityDeliberation.selector;
        selectors[7] = UniversityGovernanceFacet.startUniversityVoting.selector;
        selectors[8] = UniversityGovernanceFacet.voteUniversity.selector;
        selectors[9] = UniversityGovernanceFacet.closeUniversityResolution.selector;
        selectors[10] = UniversityGovernanceFacet.assignExecutor.selector;
        selectors[11] = UniversityGovernanceFacet.closeUniversitySession.selector;
        selectors[12] = UniversityGovernanceFacet.markActivityCompleted.selector;
        selectors[13] = UniversityGovernanceFacet.redeemIncentive.selector;
    }

    function _bucketSelectors(
        address diamond,
        bytes4[] memory selectors
    ) internal view returns (SelectorBuckets memory buckets) {
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

    function _replaceOnly(bytes4[] memory selectors)
        internal
        pure
        returns (SelectorBuckets memory buckets)
    {
        buckets.replace = selectors;
        buckets.add = new bytes4[](0);
    }

    function _countCuts(SelectorBuckets memory buckets) internal pure returns (uint256 count) {
        if (buckets.replace.length > 0) count++;
        if (buckets.add.length > 0) count++;
    }

    function _pushCuts(
        IDiamondCut.FacetCut[] memory cut,
        uint256 idx,
        address facet,
        SelectorBuckets memory buckets
    ) internal pure returns (uint256) {
        if (buckets.replace.length > 0) {
            cut[idx++] = IDiamondCut.FacetCut({
                facetAddress: facet,
                action: IDiamondCut.FacetCutAction.Replace,
                functionSelectors: buckets.replace
            });
        }

        if (buckets.add.length > 0) {
            cut[idx++] = IDiamondCut.FacetCut({
                facetAddress: facet,
                action: IDiamondCut.FacetCutAction.Add,
                functionSelectors: buckets.add
            });
        }

        return idx;
    }
}
