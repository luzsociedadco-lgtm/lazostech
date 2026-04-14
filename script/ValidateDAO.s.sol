// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

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

contract ValidateDAO is Script {

    function run() external view {

        address diamond = 0x7a94444a1bcf6E66E7C5443419A0E59D6338a463;

        ICorporateGovernanceViewFacet dao =
            ICorporateGovernanceViewFacet(diamond);

        console.log("Validating DAO at:", diamond);

        uint256 resCount = dao.getResolutionCount();
        console.log("Total resolutions:", resCount);

        for (uint256 i = 0; i < resCount; i++) {
            (
                string memory description,
                uint256 yesVotes,
                uint256 noVotes,
                bool closed
            ) = dao.getResolution(i);

            console.log("Resolution:", description);
            console.log("Yes:", yesVotes);
            console.log("No:", noVotes);
            console.log("Closed:", closed);
        }
    }
}
