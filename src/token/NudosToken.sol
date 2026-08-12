// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/// @notice Fixed-supply NUDOS token for the production deployment.
/// @dev There is intentionally no owner, mint, upgrade, or pause authority.
///      The complete supply is allocated once in the constructor.
contract NudosToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1_000_000 ether;
    uint256 public constant SAFE_ALLOCATION = 900_000 ether;
    uint256 public constant DIAMOND_ALLOCATION = 100_000 ether;

    error ZeroAddress();

    address public immutable TREASURY_SAFE;
    address public immutable REWARD_DIAMOND;

    constructor(address safeAddress, address diamondAddress) ERC20("Nudos Token", "NUDOS") {
        if (safeAddress == address(0) || diamondAddress == address(0)) revert ZeroAddress();
        if (safeAddress == diamondAddress) revert ZeroAddress();

        TREASURY_SAFE = safeAddress;
        REWARD_DIAMOND = diamondAddress;

        _mint(safeAddress, SAFE_ALLOCATION);
        _mint(diamondAddress, DIAMOND_ALLOCATION);
    }
}
