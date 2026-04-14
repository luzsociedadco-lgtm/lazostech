// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ProofOfRecyclingFacet {

    event RecyclingBadgeMinted(address indexed user, uint256 level);

    function checkAndMintBadge(address user) external {

        AppStorage.Layout storage s = AppStorage.layout();

        uint256 actions = s.userImpactTotals[user].totalActions;

        uint256 level = actions / 100;

        if (level == 0) return;

        if (level > s.userBadgeLevel[user]) {

            s.userBadgeLevel[user] = level;

            emit RecyclingBadgeMinted(user, level);
        }
    }

    function getBadgeLevel(address user)
        external
        view
        returns (uint256)
    {
        return AppStorage.layout().userBadgeLevel[user];
    }
}
