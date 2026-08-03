// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {NudosDeploymentBase} from "script/NudosDeploymentBase.s.sol";

/// @notice Rehearsal-only deployment. It cannot run against Base Mainnet.
contract DeployPilotDiamond is NudosDeploymentBase {
    uint256 internal constant BASE_SEPOLIA_CHAIN_ID = 84_532;

    function run() external {
        require(block.chainid == BASE_SEPOLIA_CHAIN_ID, "DeployPilot: Base Sepolia only");
        address deploymentOwner = vm.envOr("DEPLOYER_ADDRESS", msg.sender);
        address finalOwner = vm.envOr("DIAMOND_OWNER", msg.sender);
        _deployNudosDiamond(deploymentOwner, finalOwner);
    }
}
