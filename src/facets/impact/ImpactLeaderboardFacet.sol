// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ImpactLeaderboardFacet {

    function getTopRecyclers(uint256 limit)
        external
        view
        returns (address[] memory users, uint256[] memory totals)
    {
        AppStorage.Layout storage s = AppStorage.layout();
        uint256 length = s.recyclerIndex.length;

        // Caso base: no hay datos
        if (length == 0 || limit == 0) {
            return (new address[](0), new uint256[](0));
        }

        // Ajustar limit
        uint256 resultSize = limit > length ? length : limit;

        users = new address[](resultSize);
        totals = new uint256[](resultSize);

        for (uint256 i = 0; i < length; i++) {
            address user = s.recyclerIndex[i];
            
            // Cargamos en memoria para ahorrar gas de lectura
            AppStorage.UserImpactTotals memory impact = s.userImpactTotals[user];

            uint256 total = impact.aluminium +
                impact.plastic +
                impact.cardboard +
                impact.glass;

            // Insertion sort parcial
            for (uint256 j = 0; j < resultSize; j++) {
                if (total > totals[j]) {
                    // Shift hacia abajo
                    for (uint256 k = resultSize - 1; k > j; k--) {
                        totals[k] = totals[k - 1];
                        users[k] = users[k - 1];
                    }
                    totals[j] = total;
                    users[j] = user;
                    break;
                }
            }
        }
    }
}
