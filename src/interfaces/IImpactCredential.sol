// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IImpactCredential {
    function issueRecycleCredential(
        address user,
        uint256 machineId,
        uint256 campusId,
        uint256 universityId,
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass,
        uint256 rewardAmount
    ) external returns (uint256 tokenId);
}
