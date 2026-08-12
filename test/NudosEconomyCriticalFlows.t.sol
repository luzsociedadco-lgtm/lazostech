// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Diamond} from "src/diamond/Diamond.sol";
import {NudosFacetCutFactory} from "src/diamond/NudosFacetCutFactory.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {DiamondCutFacet} from "src/facets/core/DiamondCutFacet.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";
import {RewardFacet} from "src/facets/economy/RewardFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";
import {TreasuryFacet} from "src/facets/economy/TreasuryFacet.sol";
import {MarketplaceFacet} from "src/facets/marketplace/MarketplaceFacet.sol";
import {ProfileFacet} from "src/facets/profile/ProfileFacet.sol";
import {MachineFacet} from "src/facets/machines/MachineFacet.sol";
import {RecycleFacet} from "src/facets/recycling/RecycleFacet.sol";
import {ImpactCredentialFacet} from "src/facets/impact/ImpactCredentialFacet.sol";
import {DiamondInit} from "src/init/DiamondInit.sol";
import {AppStorage} from "src/libraries/AppStorage.sol";
import {NudosToken} from "src/token/NudosToken.sol";

abstract contract NudosEconomyTestBase is Test {
    address internal protocolOwner;
    address internal attacker;
    address internal oracle;
    address internal rewardUser;
    address internal buyer;
    address internal seller;
    address internal recipient;

    Diamond internal diamond;
    NudosToken internal token;

    function _deployEconomy() internal {
        protocolOwner = makeAddr("protocol-safe");
        attacker = makeAddr("attacker");
        oracle = makeAddr("recycling-oracle");
        rewardUser = makeAddr("reward-user");
        buyer = makeAddr("buyer");
        seller = makeAddr("seller");
        recipient = makeAddr("recipient");

        DiamondCutFacet cutFacet = new DiamondCutFacet();
        diamond = new Diamond(protocolOwner, address(cutFacet));
        DiamondInit init = new DiamondInit();
        IDiamondCut.FacetCut[] memory cut = NudosFacetCutFactory.deployFacets();

        vm.prank(protocolOwner);
        IDiamondCut(address(diamond)).diamondCut(cut, address(init), abi.encodeCall(DiamondInit.init, ()));

        token = new NudosToken(protocolOwner, address(diamond));

        vm.prank(protocolOwner);
        RewardFacet(address(diamond)).setRewardToken(address(token));

        vm.prank(rewardUser);
        ProfileFacet(address(diamond)).registerProfile("ipfs://critical-flow/user", 1000, 1);

        vm.prank(protocolOwner);
        MachineFacet(address(diamond)).registerMachine(1001, "ipfs://critical-flow/machine", oracle);

        vm.prank(protocolOwner);
        MachineFacet(address(diamond)).linkOracleToMachine(oracle, 1);
    }
}

contract NudosEconomyCriticalFlowsTest is NudosEconomyTestBase {
    function setUp() public {
        _deployEconomy();
    }

    function testRecycleOracleFlowIssuesCredentialAndPaysBoundedReward() public {
        vm.prank(oracle);
        RecycleFacet(address(diamond)).recordRecycleFromOracle(1, rewardUser, 4, 0, 0, 0);

        assertEq(token.balanceOf(rewardUser), 1 ether);
        assertEq(token.balanceOf(address(diamond)), 99_999 ether);
        assertEq(RewardFacet(address(diamond)).getNudosAccumulated(rewardUser), 1 ether);

        (uint256 aluminium, uint256 plastic, uint256 cardboard, uint256 glass, uint256 actions) =
            RecycleFacet(address(diamond)).getUserRecycleImpact(rewardUser);
        assertEq(aluminium, 4);
        assertEq(plastic, 0);
        assertEq(cardboard, 0);
        assertEq(glass, 0);
        assertEq(actions, 1);

        uint256[] memory credentials = ImpactCredentialFacet(address(diamond)).getUserRecycleCredentials(rewardUser);
        assertEq(credentials.length, 1);

        AppStorage.RecycleCredential memory credential =
            ImpactCredentialFacet(address(diamond)).getRecycleCredential(credentials[0]);
        assertEq(credential.user, rewardUser);
        assertEq(credential.machineId, 1);
        assertEq(credential.aluminium, 4);
        assertEq(credential.co2Saved, 36);
        assertEq(credential.rewardAmount, 1 ether);

        vm.prank(oracle);
        vm.expectRevert("Duplicate recycle");
        RecycleFacet(address(diamond)).recordRecycleFromOracle(1, rewardUser, 4, 0, 0, 0);
    }

    function testRewardAndTreasuryPermissionsFailClosed() public {
        vm.prank(attacker);
        vm.expectRevert("RewardFacet: NOT_OWNER");
        RewardFacet(address(diamond)).setRewardToken(address(token));

        vm.prank(attacker);
        vm.expectRevert("RewardFacet: NOT_AUTHORIZED");
        RewardFacet(address(diamond)).grantReward(attacker, 1 ether);

        vm.prank(oracle);
        vm.expectRevert("RewardFacet: MAX_REWARD_EXCEEDED");
        RewardFacet(address(diamond)).grantReward(rewardUser, 101 ether);

        vm.prank(attacker);
        vm.expectRevert("Treasury: NOT_OWNER");
        TreasuryFacet(address(diamond)).withdrawTokens(attacker, 1 ether);
    }

    function testTicketRedemptionReturnsNudosToDiamondAndRejectsReplay() public {
        vm.prank(protocolOwner);
        assertTrue(token.transfer(rewardUser, 100 ether));

        vm.prank(rewardUser);
        assertTrue(token.approve(address(diamond), type(uint256).max));

        bytes32 orderHash = keccak256("critical-ticket-order");
        uint256 diamondBefore = token.balanceOf(address(diamond));

        vm.prank(rewardUser);
        TicketsFacet(address(diamond)).redeemTicketsForOrder(2, orderHash);

        assertEq(token.balanceOf(rewardUser), 80 ether);
        assertEq(token.balanceOf(address(diamond)), diamondBefore + 20 ether);

        vm.prank(rewardUser);
        vm.expectRevert("Order already processed");
        TicketsFacet(address(diamond)).redeemTicketsForOrder(2, orderHash);
    }

    function testMarketplaceSettlementPaysSellerKeepsFeeAndRejectsReplay() public {
        vm.prank(protocolOwner);
        assertTrue(token.transfer(buyer, 1_000 ether));

        vm.prank(buyer);
        assertTrue(token.approve(address(diamond), type(uint256).max));

        bytes32 orderHash = keccak256("critical-marketplace-order");
        uint256 diamondBefore = token.balanceOf(address(diamond));

        vm.prank(buyer);
        MarketplaceFacet(address(diamond)).settleMarketplacePurchase(seller, 200 ether, orderHash);

        assertEq(token.balanceOf(buyer), 800 ether);
        assertEq(token.balanceOf(seller), 195 ether);
        assertEq(token.balanceOf(address(diamond)), diamondBefore + 5 ether);

        vm.prank(buyer);
        vm.expectRevert("Order already processed");
        MarketplaceFacet(address(diamond)).settleMarketplacePurchase(seller, 200 ether, orderHash);

        vm.prank(buyer);
        vm.expectRevert("One tx per block");
        MarketplaceFacet(address(diamond))
            .settleMarketplacePurchase(seller, 1 ether, keccak256("second-order-same-block"));
    }

    function testOwnershipTransferMovesTreasuryAuthority() public {
        address newSafe = makeAddr("new-safe");

        vm.prank(protocolOwner);
        OwnershipFacet(address(diamond)).transferOwnership(newSafe);

        vm.prank(protocolOwner);
        vm.expectRevert("Treasury: NOT_OWNER");
        TreasuryFacet(address(diamond)).withdrawTokens(recipient, 1_000 ether);

        vm.prank(newSafe);
        TreasuryFacet(address(diamond)).withdrawTokens(recipient, 1_000 ether);

        assertEq(token.balanceOf(recipient), 1_000 ether);
        assertEq(token.balanceOf(address(diamond)), 99_000 ether);
        assertEq(token.totalSupply(), 1_000_000 ether);
    }
}

contract NudosEconomyHandler is Test {
    NudosToken public immutable token;
    address public immutable diamond;
    address public immutable protocolOwner;
    address public immutable oracle;
    address public immutable rewardUser;
    address public immutable buyer;
    address public immutable seller;

    uint256 public totalRewarded;
    uint256 public nextOrder;

    constructor(
        NudosToken token_,
        address diamond_,
        address protocolOwner_,
        address oracle_,
        address rewardUser_,
        address buyer_,
        address seller_
    ) {
        token = token_;
        diamond = diamond_;
        protocolOwner = protocolOwner_;
        oracle = oracle_;
        rewardUser = rewardUser_;
        buyer = buyer_;
        seller = seller_;
    }

    function grantReward(uint96 rawAmount) external {
        uint256 available = token.balanceOf(diamond);
        uint256 maximum = available < 100 ether ? available : 100 ether;
        if (maximum == 0) return;

        uint256 amount = bound(uint256(rawAmount), 1, maximum);
        vm.prank(oracle);
        RewardFacet(diamond).grantReward(rewardUser, amount);
        totalRewarded += amount;
    }

    function redeemTickets(uint8 rawTickets) external {
        uint256 maximum = token.balanceOf(rewardUser) / 10 ether;
        if (maximum == 0) return;
        if (maximum > 25) maximum = 25;

        uint256 tickets = bound(uint256(rawTickets), 1, maximum);
        bytes32 orderHash = keccak256(abi.encode("invariant-ticket", nextOrder++));

        vm.prank(rewardUser);
        TicketsFacet(diamond).redeemTicketsForOrder(tickets, orderHash);
    }

    function settleMarketplace(uint96 rawAmount) external {
        uint256 available = token.balanceOf(buyer);
        if (available == 0) return;

        uint256 maximum = available < 500 ether ? available : 500 ether;
        uint256 amount = bound(uint256(rawAmount), 1, maximum);
        bytes32 orderHash = keccak256(abi.encode("invariant-marketplace", nextOrder++));

        vm.roll(block.number + 1);
        vm.prank(buyer);
        MarketplaceFacet(diamond).settleMarketplacePurchase(seller, amount, orderHash);
    }
}

contract NudosEconomyInvariantTest is StdInvariant, NudosEconomyTestBase {
    NudosEconomyHandler internal handler;

    function setUp() public {
        _deployEconomy();

        vm.prank(protocolOwner);
        assertTrue(token.transfer(buyer, 50_000 ether));

        vm.prank(rewardUser);
        assertTrue(token.approve(address(diamond), type(uint256).max));

        vm.prank(buyer);
        assertTrue(token.approve(address(diamond), type(uint256).max));

        handler = new NudosEconomyHandler(token, address(diamond), protocolOwner, oracle, rewardUser, buyer, seller);
        targetContract(address(handler));
    }

    function invariantTotalSupplyAndKnownBalancesAreConserved() public view {
        uint256 accounted = token.balanceOf(protocolOwner) + token.balanceOf(address(diamond))
            + token.balanceOf(rewardUser) + token.balanceOf(buyer) + token.balanceOf(seller);

        assertEq(token.totalSupply(), 1_000_000 ether);
        assertEq(accounted, token.totalSupply());
    }

    function invariantRewardAccountingMatchesSuccessfulGrants() public view {
        assertEq(RewardFacet(address(diamond)).getNudosAccumulated(rewardUser), handler.totalRewarded());
    }

    function invariantTokenConfigurationAndOwnershipRemainStable() public view {
        assertEq(RewardFacet(address(diamond)).getRewardToken(), address(token));
        assertEq(OwnershipFacet(address(diamond)).owner(), protocolOwner);
    }
}
