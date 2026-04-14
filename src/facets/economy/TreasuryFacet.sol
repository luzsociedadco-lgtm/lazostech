// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage} from "src/libraries/AppStorage.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TreasuryFacet {

    address internal constant NUDOS =
        0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C;

    // --- Modificadores ---
    modifier onlyDiamond() {
        _onlyDiamond();
        _;
    }

    modifier onlyGovernance() {
        _onlyGovernance();
        _;
    }

    // --- Funciones Internas (La lógica que faltaba) ---
    function _onlyDiamond() internal view {
        require(msg.sender == address(this), "Treasury: ONLY_DIAMOND");
    }

    function _onlyGovernance() internal view {
        AppStorage.Layout storage s = AppStorage.layout();
        require(msg.sender == s.governanceExecutor, "Treasury: NOT_GOVERNANCE");
    }

    // --- Funciones Externas ---
function treasuryExecute(address, uint256)
    external
    pure
{
    revert("Treasury disabled: migrate to internal NUDOS economy");
}

    function treasuryBalance() external view returns (uint256) {
        return IERC20(NUDOS).balanceOf(address(this));
    }
}
