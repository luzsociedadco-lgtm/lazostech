// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NudosDeploymentBase} from "script/NudosDeploymentBase.s.sol";

/// @notice Base Mainnet deployment with explicit human confirmation and Safe ownership.
contract DeployMainnetDiamond is NudosDeploymentBase {
    uint256 internal constant BASE_MAINNET_CHAIN_ID = 8_453;

    function run() external {
        require(block.chainid == BASE_MAINNET_CHAIN_ID, "DeployMainnet: wrong chain");
        require(vm.envBool("CONFIRM_MAINNET"), "DeployMainnet: confirmation missing");

        address deploymentOwner = vm.envAddress("DEPLOYER_ADDRESS");
        address finalOwner = vm.envAddress("DIAMOND_OWNER");
        require(finalOwner != deploymentOwner, "DeployMainnet: owner must be a Safe/multisig");

        _deployNudosDiamond(deploymentOwner, finalOwner);
    }
}
