// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {IERC20Minimal} from "src/interfaces/core/IERC20Minimal.sol";

contract MarketplaceFacet {
    using AppStorage for AppStorage.Layout;

    event ItemCreated(uint256 indexed itemId, address indexed owner, uint8 itemType, uint256 price);
    event ItemListed(uint256 indexed itemId, uint256 price);
    event ItemSold(uint256 indexed itemId, address indexed buyer, uint256 price);
    event TradeProposed(uint256 indexed tradeId, uint256 itemA, uint256 itemB, address proposer);
    event TradeAccepted(uint256 indexed tradeId, address accepter);
    event MarketplacePurchaseSettled(
        bytes32 indexed orderHash,
        address indexed buyer,
        address indexed seller,
        uint256 grossAmount,
        uint256 feeAmount
    );
    event MarketplaceFeeCollected(
        bytes32 indexed referenceHash,
        address indexed payer,
        uint256 amount
    );

    function createItem(uint8 itemType, string calldata metadataURI, uint256 price) external returns (uint256) {
        itemType;
        metadataURI;
        price;
        revert("Marketplace catalog is managed off-chain");
    }

    function listItem(uint256 itemId, uint256 price) external {
        itemId;
        price;
        revert("Marketplace catalog is managed off-chain");
    }

    function buyWithTokens(uint256 itemId) external {
        itemId;
        revert("Use settleMarketplacePurchase with off-chain listings");
    }

    function proposeTrade(uint256 itemA, uint256 itemB) external returns (uint256) {
        itemA;
        itemB;
        revert("Marketplace trades are managed off-chain");
    }

    function acceptTrade(uint256 tradeId) external {
        tradeId;
        revert("Marketplace trades are managed off-chain");
    }

    function rateItem(uint256 itemId, uint8 rating) external {
        itemId;
        rating;
        revert("Marketplace ratings are managed off-chain");
    }

    function getItem(uint256 itemId)
        external
        pure
        returns (address owner, uint8 itemType, string memory metadataURI, uint256 price, uint8 status)
    {
        itemId;
        revert("Marketplace catalog is managed off-chain");
    }

    function settleMarketplacePurchase(address seller, uint256 grossAmount, bytes32 orderHash) external {
        AppStorage.Layout storage s = AppStorage.layout();

        require(s.token != address(0), "Token not set");
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Self purchase not allowed");
        require(grossAmount > 0, "Invalid gross amount");
        require(orderHash != bytes32(0), "Order hash required");
        require(!s.processedMarketplaceOrders[orderHash], "Order already processed");
        require(s.lastPurchaseBlock[msg.sender] < block.number, "One tx per block");

        s.processedMarketplaceOrders[orderHash] = true;
        s.lastPurchaseBlock[msg.sender] = block.number;

        uint256 fee = (grossAmount * s.marketplaceFeeBps) / 10000;
        uint256 sellerAmount = grossAmount - fee;
        IERC20Minimal token = IERC20Minimal(s.token);

        require(token.transferFrom(msg.sender, address(this), grossAmount), "Buyer payment failed");
        require(token.transfer(seller, sellerAmount), "Seller payout failed");

        emit MarketplacePurchaseSettled(orderHash, msg.sender, seller, grossAmount, fee);
    }

    function collectMarketplaceFee(uint256 amount, bytes32 referenceHash) external {
        AppStorage.Layout storage s = AppStorage.layout();

        require(s.token != address(0), "Token not set");
        require(amount > 0, "Invalid amount");
        require(referenceHash != bytes32(0), "Reference hash required");
        require(!s.processedMarketplaceOrders[referenceHash], "Reference already processed");

        s.processedMarketplaceOrders[referenceHash] = true;

        require(
            IERC20Minimal(s.token).transferFrom(msg.sender, address(this), amount),
            "Fee payment failed"
        );

        emit MarketplaceFeeCollected(referenceHash, msg.sender, amount);
    }

    function executeMarketplaceFee(uint256 feeBps) external {
        AppStorage.Layout storage s = AppStorage.layout();

        require(msg.sender == address(this), "Only DAO");
        require(feeBps <= 1000, "Max 10%");

        s.marketplaceFeeBps = feeBps;
    }

    function spendTreasury(address to, uint256 amount) external {
        AppStorage.Layout storage s = AppStorage.layout();

        require(msg.sender == address(this), "Only DAO");
        require(to != address(0), "Invalid address");
        require(amount > 0, "Invalid amount");
        require(s.token != address(0), "Token not set");
        require(IERC20Minimal(s.token).transfer(to, amount), "Treasury transfer failed");
    }
}
