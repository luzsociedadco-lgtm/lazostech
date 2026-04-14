// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ImpactCredentialFacet {

    event ImpactCredentialMinted(
        uint256 indexed tokenId,
        address indexed user,
        uint256 year,
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass,
        uint256 co2Saved
    );

    struct Credential {
        address user;
        uint256 year;
        uint256 aluminium;
        uint256 plastic;
        uint256 cardboard;
        uint256 glass;
        uint256 co2Saved;
    }

function mintImpactCredential(address user, uint256 year) external {

    AppStorage.Layout storage s = AppStorage.layout();

require(user != address(0), "Invalid user");
require(year >= 2025, "Invalid year");

	require(s.profiles[user].exists, "User not found");

	    // 🚫 evitar doble mint por año
    require(!s.userYearCredentialMinted[user][year], 
	"Credential already minted for year"
    );

    AppStorage.UserImpactTotals storage totals =
        s.userImpactTotals[user];

    uint256 aluminium = totals.aluminium;
    uint256 plastic = totals.plastic;
    uint256 cardboard = totals.cardboard;
    uint256 glass = totals.glass;

require(aluminium 
	+ plastic 
	+ cardboard 
	+ glass > 0,
    "No impact"
        );

    uint256 co2Saved =
        aluminium * 9 +
        plastic * 6 +
        cardboard * 3 +
        glass * 1;

    uint256 tokenId = ++s.nextImpactCredentialId;

    s.impactCredentials[tokenId] = AppStorage.ImpactCredential(
        user,
        year,
        aluminium,
        plastic,
        cardboard,
        glass,
        co2Saved
    );

    s.userImpactCredentials[user].push(tokenId);

    // ✅ marcar como mintado
    s.userYearCredentialMinted[user][year] = true;

    emit ImpactCredentialMinted(
        tokenId,
        user,
        year,
        aluminium,
        plastic,
        cardboard,
        glass,
        co2Saved
    );

}

    function getCredential(uint256 tokenId)
        external
        view
	returns (AppStorage.ImpactCredential memory)
    {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.impactCredentials[tokenId];
    }

    function getUserCredentials(address user)
        external
        view
        returns (uint256[] memory)
    {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.userImpactCredentials[user];
    }
}
