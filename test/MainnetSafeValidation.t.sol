// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {DeployMainnetDiamond} from "script/DeployMainnetDiamond.s.sol";

contract DeployMainnetDiamondHarness is DeployMainnetDiamond {
    function validateProductionSafe(address candidate) external view {
        _validateProductionSafe(candidate);
    }
}

contract MockProductionSafe {
    address[] internal owners;
    uint256 internal threshold;

    constructor(uint256 ownerCount, uint256 threshold_) {
        threshold = threshold_;
        for (uint256 i; i < ownerCount; i++) {
            owners.push(address(uint160(i + 1)));
        }
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getThreshold() external view returns (uint256) {
        return threshold;
    }
}

contract NotASafe {}

contract MainnetSafeValidationTest is Test {
    DeployMainnetDiamondHarness internal harness;

    function setUp() public {
        harness = new DeployMainnetDiamondHarness();
    }

    function testAcceptsDeployedThreeOwnerTwoThresholdSafe() public {
        harness.validateProductionSafe(address(new MockProductionSafe(3, 2)));
    }

    function testRejectsEOAOwner() public {
        vm.expectRevert("DeployMainnet: Safe must be deployed");
        harness.validateProductionSafe(makeAddr("eoa-owner"));
    }

    function testRejectsContractWithoutSafeInterface() public {
        NotASafe candidate = new NotASafe();
        vm.expectRevert("DeployMainnet: invalid Safe owners");
        harness.validateProductionSafe(address(candidate));
    }

    function testRejectsInsufficientOwners() public {
        MockProductionSafe candidate = new MockProductionSafe(2, 2);
        vm.expectRevert("DeployMainnet: Safe needs 3 owners");
        harness.validateProductionSafe(address(candidate));
    }

    function testRejectsWeakOrImpossibleThreshold() public {
        MockProductionSafe weakThreshold = new MockProductionSafe(3, 1);
        MockProductionSafe impossibleThreshold = new MockProductionSafe(3, 4);

        vm.expectRevert("DeployMainnet: invalid Safe threshold");
        harness.validateProductionSafe(address(weakThreshold));

        vm.expectRevert("DeployMainnet: invalid Safe threshold");
        harness.validateProductionSafe(address(impossibleThreshold));
    }
}
