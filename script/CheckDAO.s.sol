// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

interface ICorporateGovernanceViewFacet {
    function getResolutionCount() external view returns (uint256);

    function getResolution(uint256 id)
        external
        view
        returns (
            string memory description,
            uint256 yesVotes,
            uint256 noVotes,
            bool closed
        );
}

contract CheckDAO is Script {

    function run() external view {

        // 🔴 REEMPLAZAR con tu Diamond address real
        address diamond = 0xd4A7AfD1f031f2fc11b9651D784f197DE5b25607;

        ICorporateGovernanceViewFacet dao =
            ICorporateGovernanceViewFacet(diamond);

        console.log("Diamond:", diamond);

        uint256 resCount = dao.getResolutionCount();
        console.log("Total resolutions:", resCount);

        for (uint256 i = 0; i < resCount; i++) {
            (
                string memory description,
                uint256 yesVotes,
                uint256 noVotes,
                bool closed
            ) = dao.getResolution(i);

            console.log("---- Resolution ----");
            console.log("Description:", description);
            console.log("Yes votes:", yesVotes);
            console.log("No votes:", noVotes);
            console.log("Closed:", closed);
        }
    }
}
