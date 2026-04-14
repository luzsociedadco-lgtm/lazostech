// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IProofOfRecycling {

    event RecyclingRecorded(
        address indexed user,
        uint256 indexed machineId,
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass,
        uint256 timestamp
    );

    function recordRecycleFromOracle(
        uint256 machineId,
        address user,
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass
    ) external;

    function getUserRecycleImpact(address user)
        external
        view
        returns (
            uint256 aluminium,
            uint256 plastic,
            uint256 cardboard,
            uint256 glass,
            uint256 actions
        );
}
