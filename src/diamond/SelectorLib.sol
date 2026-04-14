// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 🔗 IMPORTAMOS TODOS LOS FACETS (necesario para .selector)
import {DiamondCutFacet} from "src/facets/core/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "src/facets/core/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";

import {ParticipationFacet} from "src/facets/economy/ParticipationFacet.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";
import {TreasuryFacet} from "src/facets/economy/TreasuryFacet.sol";

import {MarketplaceFacet} from "src/facets/marketplace/MarketplaceFacet.sol";

import {CorporateGovernanceFacet} from "src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol";
import {UniversityGovernanceFacet} from "src/facets/governance/university-governance/UniversityGovernanceFacet.sol";
import {UniversityGovernanceViewFacet} from "src/facets/governance/university-governance/UniversityGovernanceViewFacet.sol";
import {CorporateGovernanceViewFacet} from "src/facets/governance/corporate-governance/CorporateGovernanceViewFacet.sol";
import {GovernanceRolesViewFacet} from "src/facets/governance/corporate-governance/GovernanceRolesViewFacet.sol";
import {CampusFacet} from "src/facets/recycling/CampusFacet.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";
import {UniversityFacet} from "src/facets/recycling/UniversityFacet.sol";
import {ImpactLeaderboardFacet} from "src/facets/impact/ImpactLeaderboardFacet.sol";
import {ImpactCredentialFacet} from "src/facets/impact/ImpactCredentialFacet.sol";
import {ImpactFacet} from "src/facets/impact/ImpactFacet.sol";
import {MachineFacet} from "src/facets/machines/MachineFacet.sol";
import {ProfileFacet} from "src/facets/profile/ProfileFacet.sol";

library SelectorLib {

function getDiamondCutFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](1);
    selectors[0] = DiamondCutFacet.diamondCut.selector;
}

function getDiamondLoupeFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](4);
    selectors[0] = DiamondLoupeFacet.facetAddress.selector;
    selectors[1] = DiamondLoupeFacet.facetAddresses.selector;
    selectors[2] = DiamondLoupeFacet.facetFunctionSelectors.selector;
    selectors[3] = DiamondLoupeFacet.facets.selector;
}

function getOwnershipFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](2);
    selectors[0] = OwnershipFacet.owner.selector;
    selectors[1] = OwnershipFacet.transferOwnership.selector;
}

function getParticipationFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](2);
    selectors[0] = ParticipationFacet.registerSubmission.selector;
    selectors[1] = ParticipationFacet.validateCompletion.selector;
}

function getRewardFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](7);
selectors[0] = RewardFacet.setRewardToken.selector;
selectors[1] = RewardFacet.setRecycleRate.selector;
selectors[2] = RewardFacet.grantReward.selector;
selectors[3] = RewardFacet.getRewardToken.selector;
selectors[4] = RewardFacet.getRecycleRate.selector;
selectors[5] = RewardFacet.getNudos.selector;
selectors[6] = RewardFacet.getNudosAccumulated.selector;
}

function getTicketsFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](6);
    selectors[0] = TicketsFacet.getTickets.selector;
    selectors[1] = TicketsFacet.mintTicket.selector;
    selectors[2] = TicketsFacet.redeemTickets.selector;
    selectors[3] = TicketsFacet.transferTicket.selector;
    selectors[4] = TicketsFacet.useTicket.selector;
    selectors[5] = TicketsFacet.grantTicketsFromFiat.selector;
}

function getMarketplaceFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](9);
    selectors[0] = MarketplaceFacet.acceptTrade.selector;
    selectors[1] = MarketplaceFacet.buyWithTokens.selector;
    selectors[2] = MarketplaceFacet.createItem.selector;
    selectors[3] = MarketplaceFacet.getItem.selector;
    selectors[4] = MarketplaceFacet.listItem.selector;
    selectors[5] = MarketplaceFacet.proposeTrade.selector;
    selectors[6] = MarketplaceFacet.rateItem.selector;
    selectors[7] = MarketplaceFacet.executeMarketplaceFee.selector;
    selectors[8] = MarketplaceFacet.spendTreasury.selector;
}

function getCampusFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](7);
    selectors[0] = CampusFacet.createCampus.selector;
    selectors[1] = CampusFacet.updateCampus.selector;
    selectors[2] = CampusFacet.addCampusStaff.selector;
    selectors[3] = CampusFacet.removeCampusStaff.selector;
    selectors[4] = CampusFacet.isCampusStaff.selector;
    selectors[5] = CampusFacet.getCampus.selector;
    selectors[6] = CampusFacet.listCampusIds.selector;
}

function getRecycleFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](10);
    selectors[0] = RecycleFacet.recordRecycleFromOracle.selector;
    selectors[1] = RecycleFacet.setRecyclingOracle.selector;
    selectors[2] = RecycleFacet.recordRecycleBatch.selector;
    selectors[3] = RecycleFacet.getUserRecycleImpact.selector;
    selectors[4] = RecycleFacet.getRecycleHistory.selector;
    selectors[5] = RecycleFacet.apiUserImpact.selector;
    selectors[6] = RecycleFacet.apiProgramImpact.selector;
    selectors[7] = RecycleFacet.apiCampusImpact.selector;
    selectors[8] = RecycleFacet.apiUniversityImpact.selector;
    selectors[9] = RecycleFacet.apiGlobalImpact.selector;
}

function getUniversityFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](6);
    selectors[0] = UniversityFacet.addUniversityStaff.selector;
    selectors[1] = UniversityFacet.removeUniversityStaff.selector;
    selectors[2] = UniversityFacet.isUniversityStaff.selector;
    selectors[3] = UniversityFacet.createUniversity.selector;
    selectors[4] = UniversityFacet.getUniversity.selector;
    selectors[5] = UniversityFacet.bootstrapUniversityStaff.selector;
}

function getCorporateGovernanceFacetSelectors() internal pure returns (bytes4[] memory selectors){
    selectors = new bytes4[](14);

    selectors[0]  = CorporateGovernanceFacet.initDao.selector;
    selectors[1]  = CorporateGovernanceFacet.setChairperson.selector;
    selectors[2]  = CorporateGovernanceFacet.setSecretary.selector;
    selectors[3]  = CorporateGovernanceFacet.addBoardMember.selector;
    selectors[4]  = CorporateGovernanceFacet.openSession.selector;
    selectors[5]  = CorporateGovernanceFacet.createResolution.selector;
    selectors[6]  = CorporateGovernanceFacet.startDeliberation.selector;
    selectors[7]  = CorporateGovernanceFacet.startVoting.selector;
    selectors[8]  = CorporateGovernanceFacet.vote.selector;
    selectors[9]  = CorporateGovernanceFacet.closeResolution.selector;
    selectors[10] = CorporateGovernanceFacet.executeResolution.selector;
    selectors[11] = CorporateGovernanceFacet.verifyResolution.selector;
    selectors[12] = CorporateGovernanceFacet.setGovernanceExecutor.selector;
    selectors[13] = CorporateGovernanceFacet.setQuorumPercentage.selector;
}

function getUniversityGovernanceFacetSelectors() internal pure returns (bytes4[] memory selectors){
    selectors = new bytes4[](11);

    selectors[0] = UniversityGovernanceFacet.initUniversityDao.selector;
    selectors[1] = UniversityGovernanceFacet.addMember.selector;
    selectors[2] = UniversityGovernanceFacet.openUniversitySession.selector;
    selectors[3] = UniversityGovernanceFacet.createUniversityResolution.selector;
    selectors[4] = UniversityGovernanceFacet.startUniversityDeliberation.selector;
    selectors[5] = UniversityGovernanceFacet.startUniversityVoting.selector;
    selectors[6] = UniversityGovernanceFacet.voteUniversity.selector;
    selectors[7] = UniversityGovernanceFacet.closeUniversityResolution.selector;
    selectors[8] = UniversityGovernanceFacet.assignExecutor.selector;
    selectors[9] = UniversityGovernanceFacet.markActivityCompleted.selector;
    selectors[10] = UniversityGovernanceFacet.redeemIncentive.selector;
}

function getGovernanceRolesViewFacetSelectors() internal pure returns (bytes4[] memory selectors){
    selectors = new bytes4[](9);
    selectors[0] = GovernanceRolesViewFacet.isChairperson.selector;
    selectors[1] = GovernanceRolesViewFacet.isBoardMember.selector;
    selectors[2] = GovernanceRolesViewFacet.isAssemblyAdmin.selector;
    selectors[3] = GovernanceRolesViewFacet.isResponsible.selector;
    selectors[4] = GovernanceRolesViewFacet.isProposer.selector;
    selectors[5] = GovernanceRolesViewFacet.isMember.selector;
    selectors[6] = GovernanceRolesViewFacet.isUniversityMember.selector;
    selectors[7] = GovernanceRolesViewFacet.getChairperson.selector;
    selectors[8] = GovernanceRolesViewFacet.getSecretary.selector;
}

function getCorporateGovernanceViewFacetSelectors() internal pure returns (bytes4[] memory selectors){
    selectors = new bytes4[](2);

    selectors[0] = CorporateGovernanceViewFacet.getResolutionCount.selector;
    selectors[1] = CorporateGovernanceViewFacet.getResolution.selector;
}


function getUniversityGovernanceViewFacetSelectors() internal pure returns (bytes4[] memory selectors){
    selectors = new bytes4[](1);

    selectors[0] = UniversityGovernanceViewFacet.getExecutorInfo.selector;
}

function getImpactLeaderboardFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](1);
    selectors[0] = ImpactLeaderboardFacet.getTopRecyclers.selector;
}

function getMachineFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](6);
    selectors[0] = MachineFacet.registerMachine.selector;
    selectors[1] = MachineFacet.setMachineStatus.selector;
    selectors[2] = MachineFacet.getMachine.selector;
    selectors[3] = MachineFacet.getMachines.selector;
    selectors[4] = MachineFacet.linkOracleToMachine.selector;
    selectors[5] = MachineFacet.unlinkOracle.selector;
}

function getProfileFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](4);

    selectors[0] = ProfileFacet.registerProfile.selector;
    selectors[1] = ProfileFacet.updateProfile.selector;
    selectors[2] = ProfileFacet.getProfile.selector;
    selectors[3] = ProfileFacet.listProfiles.selector;
}

function getTreasuryFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](2);

    selectors[0] = TreasuryFacet.treasuryExecute.selector;
    selectors[1] = TreasuryFacet.treasuryBalance.selector;

}

function getImpactCredentialFacetSelectors() internal pure returns (bytes4[] memory selectors){
    selectors = new bytes4[](3);

    selectors[0] = ImpactCredentialFacet.mintImpactCredential.selector;
    selectors[1] = ImpactCredentialFacet.getCredential.selector;
    selectors[2] = ImpactCredentialFacet.getUserCredentials.selector;
}

function getImpactFacetSelectors() internal pure returns (bytes4[] memory selectors) {
    selectors = new bytes4[](4);

    selectors[0] = ImpactFacet.getCampusImpact.selector;
    selectors[1] = ImpactFacet.getUniversityImpact.selector;
    selectors[2] = ImpactFacet.getSustainabilityScore.selector;
    selectors[3] = ImpactFacet.getImpactDashboard.selector;
}

}
