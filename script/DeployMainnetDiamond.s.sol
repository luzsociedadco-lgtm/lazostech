// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NudosDeploymentBase} from "script/NudosDeploymentBase.s.sol";

interface IProductionSafe {
    function getOwners() external view returns (address[] memory);

    function getThreshold() external view returns (uint256);
}

/// @notice Base Mainnet deployment with explicit human confirmation and Safe ownership.
contract DeployMainnetDiamond is NudosDeploymentBase {
    uint256 internal constant BASE_MAINNET_CHAIN_ID = 8_453;

    function run() external {
        require(block.chainid == BASE_MAINNET_CHAIN_ID, "DeployMainnet: wrong chain");
        require(vm.envBool("CONFIRM_MAINNET"), "DeployMainnet: confirmation missing");

        address deploymentOwner = vm.envAddress("DEPLOYER_ADDRESS");
        address finalOwner = vm.envAddress("DIAMOND_OWNER");
        require(finalOwner != deploymentOwner, "DeployMainnet: owner must be a Safe/multisig");
        _validateProductionSafe(finalOwner);

        _deployNudosDiamond(deploymentOwner, finalOwner);
    }

    function _validateProductionSafe(address candidate) internal view {
        require(candidate.code.length > 0, "DeployMainnet: Safe must be deployed");

        address[] memory owners;
        uint256 threshold;
        try IProductionSafe(candidate).getOwners() returns (address[] memory safeOwners) {
            owners = safeOwners;
        } catch {
            revert("DeployMainnet: invalid Safe owners");
        }
        try IProductionSafe(candidate).getThreshold() returns (uint256 safeThreshold) {
            threshold = safeThreshold;
        } catch {
            revert("DeployMainnet: invalid Safe threshold");
        }

        require(owners.length >= 3, "DeployMainnet: Safe needs 3 owners");
        require(threshold >= 2 && threshold <= owners.length, "DeployMainnet: invalid Safe threshold");
    }
}
