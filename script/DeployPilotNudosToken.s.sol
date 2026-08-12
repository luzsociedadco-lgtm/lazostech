// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {NudosToken} from "src/token/NudosToken.sol";

/// @notice Deploys the same fixed-supply token used for the Base Sepolia rehearsal.
contract DeployPilotNudosToken is Script {
    uint256 internal constant BASE_SEPOLIA_CHAIN_ID = 84_532;

    function run() external returns (NudosToken token) {
        require(block.chainid == BASE_SEPOLIA_CHAIN_ID, "DeployPilotToken: wrong chain");

        address deploymentOwner = vm.envOr("DEPLOYER_ADDRESS", msg.sender);
        address safeAddress = vm.envAddress("DIAMOND_OWNER");
        address diamondAddress = vm.envAddress("DIAMOND_ADDRESS");
        require(safeAddress != address(0), "DeployPilotToken: zero Safe");
        require(diamondAddress != address(0), "DeployPilotToken: zero Diamond");
        require(safeAddress != diamondAddress, "DeployPilotToken: duplicate allocation address");
        require(msg.sender == deploymentOwner, "DeployPilotToken: sender does not match DEPLOYER_ADDRESS");

        vm.startBroadcast();
        token = new NudosToken(safeAddress, diamondAddress);
        vm.stopBroadcast();

        console2.log("PILOT NUDOS TOKEN DEPLOYED AT:", address(token));
    }
}
