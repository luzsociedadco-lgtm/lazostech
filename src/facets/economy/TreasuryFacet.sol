// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {IERC20Minimal} from "src/interfaces/core/IERC20Minimal.sol";

contract TreasuryFacet {
    modifier onlyDiamond() {
        require(msg.sender == address(this), "Treasury: ONLY_DIAMOND");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == AppStorage.layout().owner, "Treasury: NOT_OWNER");
        _;
    }

    function treasuryExecute(address to, uint256 amount) external onlyDiamond {
        require(to != address(0), "Treasury: ZERO_ADDRESS");

        address token = AppStorage.layout().token;
        require(token != address(0), "Treasury: TOKEN_NOT_SET");
        require(IERC20Minimal(token).transfer(to, amount), "Treasury: TRANSFER_FAILED");
    }

    function treasuryBalance() external view returns (uint256) {
        address token = AppStorage.layout().token;
        if (token == address(0)) {
            return 0;
        }

        return IERC20Minimal(token).balanceOf(address(this));
    }

    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Treasury: ZERO_ADDRESS");

        address token = AppStorage.layout().token;
        require(token != address(0), "Treasury: TOKEN_NOT_SET");
        require(IERC20Minimal(token).transfer(to, amount), "Treasury: TRANSFER_FAILED");
    }
}
