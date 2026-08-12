// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {NudosToken} from "src/token/NudosToken.sol";

/// @notice Deploys the fixed-supply NUDOS token after the Diamond exists.
/// @dev The deployer only pays gas; neither the deployer nor a raw key becomes
///      a token authority because NudosToken has no administrative functions.
contract DeployNudosToken is Script {
    uint256 internal constant BASE_MAINNET_CHAIN_ID = 8_453;

    function run() external returns (NudosToken token) {
        require(block.chainid == BASE_MAINNET_CHAIN_ID, "DeployToken: wrong chain");

        address deploymentOwner = vm.envAddress("DEPLOYER_ADDRESS");
        address safeAddress = vm.envAddress("DIAMOND_OWNER");
        address diamondAddress = vm.envAddress("DIAMOND_ADDRESS");
        require(deploymentOwner != address(0), "DeployToken: zero deployer");
        require(safeAddress != address(0), "DeployToken: zero Safe");
        require(diamondAddress != address(0), "DeployToken: zero Diamond");
        require(safeAddress != diamondAddress, "DeployToken: duplicate allocation address");
        require(msg.sender == deploymentOwner, "DeployToken: sender does not match DEPLOYER_ADDRESS");

        vm.startBroadcast();
        token = new NudosToken(safeAddress, diamondAddress);
        vm.stopBroadcast();

        console2.log("NUDOS TOKEN DEPLOYED AT:", address(token));
        console2.log("NUDOS SAFE ALLOCATION:", token.balanceOf(safeAddress));
        console2.log("NUDOS DIAMOND ALLOCATION:", token.balanceOf(diamondAddress));
    }
}
