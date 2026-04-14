// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract DiamondInit {
function init() external {
    AppStorage.Layout storage s = AppStorage.layout();

    // =============================================================
    // 🔐 PROTOCOL OWNER
    // =============================================================
    s.owner = msg.sender;

    // =============================================================
    // 🎟️ TICKETS ECONOMY
    // =============================================================
    s.nudosPerTicket = 10;
    s.ticketPriceInTokens = 1 ether; 
    // 1 ticket = 10 NUDOS (ajustable luego)

    // =============================================================
    // 🪙 MARKETPLACE ECONOMY
    // =============================================================
    s.marketplaceFeeBps = 250; 
    // 2.5% fee marketplace

// =============================================================
//  RECYCLING REWARD RATES
// =============================================================

// PILOTO: solo aluminio activo
// 4 latas = 1 NUDOS → 0.25 NUDOS por lata

s.recycleRates[AppStorage.Material.AL] = 0.25 ether;

// materiales listos pero desactivados
s.recycleRates[AppStorage.Material.PL] = 0;
s.recycleRates[AppStorage.Material.CB] = 0;
s.recycleRates[AppStorage.Material.GL] = 0;

}

}
