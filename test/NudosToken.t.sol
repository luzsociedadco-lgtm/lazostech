// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {NudosToken} from "src/token/NudosToken.sol";

contract NudosTokenTest is Test {
    address internal safeAddress = makeAddr("safe");
    address internal diamondAddress = makeAddr("diamond");
    address internal user = makeAddr("user");
    NudosToken internal token;

    function setUp() public {
        token = new NudosToken(safeAddress, diamondAddress);
    }

    function testFixedSupplyAndGenesisAllocation() public view {
        assertEq(token.totalSupply(), 1_000_000 ether);
        assertEq(token.balanceOf(safeAddress), 900_000 ether);
        assertEq(token.balanceOf(diamondAddress), 100_000 ether);
        assertEq(token.TREASURY_SAFE(), safeAddress);
        assertEq(token.REWARD_DIAMOND(), diamondAddress);
    }

    function testTransfersRemainStandardERC20() public {
        vm.prank(diamondAddress);
        assertTrue(token.transfer(user, 10 ether));
        assertEq(token.balanceOf(user), 10 ether);
        assertEq(token.balanceOf(diamondAddress), 99_990 ether);
    }

    function testNoMintFunctionIsExposed() public {
        (bool success,) = address(token).call(abi.encodeWithSignature("mint(address,uint256)", user, 1 ether));
        assertFalse(success);
        assertEq(token.totalSupply(), 1_000_000 ether);
    }

    function testNoPrivilegedBurnPauseOwnerOrUpgradeSurfaceIsExposed() public {
        (bool burnSuccess,) = address(token).call(abi.encodeWithSignature("burn(uint256)", 1 ether));
        (bool pauseSuccess,) = address(token).call(abi.encodeWithSignature("pause()"));
        (bool ownerSuccess,) = address(token).call(abi.encodeWithSignature("owner()"));
        (bool upgradeSuccess,) =
            address(token).call(abi.encodeWithSignature("upgradeToAndCall(address,bytes)", user, bytes("")));

        assertFalse(burnSuccess);
        assertFalse(pauseSuccess);
        assertFalse(ownerSuccess);
        assertFalse(upgradeSuccess);
        assertEq(token.totalSupply(), 1_000_000 ether);
    }

    function testSafeReserveCanReplenishDiamondWithoutChangingSupply() public {
        uint256 topUp = 25_000 ether;

        vm.prank(diamondAddress);
        assertTrue(token.transfer(user, topUp));

        vm.prank(safeAddress);
        assertTrue(token.transfer(diamondAddress, topUp));

        assertEq(token.balanceOf(safeAddress), 875_000 ether);
        assertEq(token.balanceOf(diamondAddress), 100_000 ether);
        assertEq(token.balanceOf(user), 25_000 ether);
        assertEq(token.totalSupply(), 1_000_000 ether);
    }

    function testRejectsZeroOrDuplicateAllocationAddresses() public {
        vm.expectRevert(NudosToken.ZeroAddress.selector);
        new NudosToken(address(0), diamondAddress);

        vm.expectRevert(NudosToken.ZeroAddress.selector);
        new NudosToken(safeAddress, address(0));

        vm.expectRevert(NudosToken.ZeroAddress.selector);
        new NudosToken(safeAddress, safeAddress);
    }

    function testFuzzSupplyCannotIncreaseThroughTransfers(uint96 amount) public {
        uint256 transferAmount = bound(uint256(amount), 0, token.balanceOf(diamondAddress));

        vm.prank(diamondAddress);
        assertTrue(token.transfer(user, transferAmount));

        assertEq(token.totalSupply(), 1_000_000 ether);
    }
}
