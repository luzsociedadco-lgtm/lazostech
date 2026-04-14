// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IReward {
    function grantReward(address user, uint256 amount) external;
}
