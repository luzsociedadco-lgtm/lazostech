// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ImpactFacet {

    // =============================================================
    // USER IMPACT
    // =============================================================

    function getUserImpact(address user)
        external
        view
        returns (
            uint256 aluminium,
            uint256 plastic,
            uint256 cardboard,
            uint256 glass
        )
    {
        AppStorage.Layout storage s = AppStorage.layout();

AppStorage.UserImpactTotals storage totals =
    s.userImpactTotals[user];

return (
    totals.aluminium,
    totals.plastic,
    totals.cardboard,
    totals.glass
);

    }

    // =============================================================
    // CAMPUS IMPACT
    // =============================================================

function getCampusImpact(uint256 campusId)
    external
    view
    returns (
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass
    )
{
    AppStorage.UserImpactTotals storage totals =
        AppStorage.layout().campusImpactTotals[campusId];

    return (
        totals.aluminium,
        totals.plastic,
        totals.cardboard,
        totals.glass
    );
}

    // =============================================================
    // UNIVERSITY IMPACT
    // =============================================================

function getUniversityImpact(uint256 universityId)
    external
    view
    returns (
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass
    )
{
    AppStorage.UserImpactTotals storage totals =
        AppStorage.layout().universityImpactTotals[universityId];

    return (
        totals.aluminium,
        totals.plastic,
        totals.cardboard,
        totals.glass
    );
}

// =============================================================
// LAZOS SUSTAINABILITY SCORE
// =============================================================

function getSustainabilityScore(address user)
    external
    view
    returns (uint256 score)
{
    AppStorage.Layout storage s = AppStorage.layout();

AppStorage.UserImpactTotals storage totals =
    s.userImpactTotals[user];

uint256 co2Saved =
    totals.aluminium * 9 +
    totals.plastic * 6 +
    totals.cardboard * 3 +
    totals.glass * 1;

score =
    totals.aluminium * 10 +
    totals.plastic * 6 +
    totals.cardboard * 4 +
    totals.glass * 2 +
    co2Saved;
}

// =============================================================
// IMPACT DASHBOARD API
// =============================================================

function getImpactDashboard(address user)
    external
    view
    returns (
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass,
        uint256 co2Saved,
        uint256 sustainabilityScore
    )
{
    AppStorage.Layout storage s = AppStorage.layout();

    AppStorage.UserImpactTotals storage totals =
        s.userImpactTotals[user];

    aluminium = totals.aluminium;
    plastic = totals.plastic;
    cardboard = totals.cardboard;
    glass = totals.glass;

    co2Saved =
        aluminium * 9 +
        plastic * 6 +
        cardboard * 3 +
        glass * 1;

    sustainabilityScore =
        aluminium * 10 +
        plastic * 6 +
        cardboard * 4 +
        glass * 2 +
        co2Saved;
	}

}
