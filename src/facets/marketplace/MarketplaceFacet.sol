// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract MarketplaceFacet {
    using AppStorage for AppStorage.Layout;

    event ItemCreated(uint256 indexed itemId, address indexed owner, uint8 itemType, uint256 price);
    event ItemListed(uint256 indexed itemId, uint256 price);
    event ItemSold(uint256 indexed itemId, address indexed buyer, uint256 price);
    event TradeProposed(uint256 indexed tradeId, uint256 itemA, uint256 itemB, address proposer);
    event TradeAccepted(uint256 indexed tradeId, address accepter);

    function createItem(uint8 itemType, string calldata metadataURI, uint256 price) external returns (uint256) {
        AppStorage.Layout storage s = AppStorage.layout();
        uint256 id = ++s.nextItemId;
	require(bytes(metadataURI).length > 0, "Metadata required");

        s.items[id] = AppStorage.Item({
            id: id,
            owner: msg.sender,
            itemType: itemType,
            metadataURI: metadataURI,
            price: price,
            status: AppStorage.ItemStatus.Unlisted
        });

        emit ItemCreated(id, msg.sender, itemType, price);
        return id;
    }

    function listItem(uint256 itemId, uint256 price) external {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Item storage it = s.items[itemId];

require(it.id != 0, "Item does not exist");
require(it.owner == msg.sender, "Not owner");
require(price > 0, "Price must be > 0");

it.price = price;
it.status = AppStorage.ItemStatus.Listed;

        emit ItemListed(itemId, price);
    }

function buyWithTokens(uint256 itemId) external {
    AppStorage.Layout storage s = AppStorage.layout();
    AppStorage.Item storage it = s.items[itemId];

    require(it.id != 0, "Item does not exist");
    require(it.status == AppStorage.ItemStatus.Listed, "Not for sale");
    require(it.owner != msg.sender, "Cannot buy your own item");
    require(it.price > 0, "Invalid price");

    uint256 price = it.price;
require(s.lastPurchaseBlock[msg.sender] < block.number, "One tx per block");
s.lastPurchaseBlock[msg.sender] = block.number;

uint256 buyerBalance = s.nudosBalance[msg.sender];
require(buyerBalance >= price, "Insufficient balance");

    // 💰 calcular fee
    uint256 fee = (price * s.marketplaceFeeBps) / 10000;
    uint256 sellerAmount = price - fee;

    address seller = it.owner;

    // 🔄 actualizar balances
s.nudosBalance[msg.sender] -= price;
s.nudosBalance[seller] += sellerAmount;
s.nudosBalance[address(this)] += fee; // treasury vive en el contrato

    // 🔁 transferir ownership
    it.owner = msg.sender;
    it.status = AppStorage.ItemStatus.Sold;
	it.price = 0;

    emit ItemSold(itemId, msg.sender, price);
}

    function proposeTrade(uint256 itemA, uint256 itemB) external returns (uint256) {
        AppStorage.Layout storage s = AppStorage.layout();
        require(s.items[itemA].owner == msg.sender, "Not owner of itemA");
	require(s.items[itemB].id != 0, "ItemB does not exist");

        uint256 id = ++s.nextTradeId;
        s.trades[id] = AppStorage.Trade({id: id, proposer: msg.sender, itemA: itemA, itemB: itemB, accepted: false});

        emit TradeProposed(id, itemA, itemB, msg.sender);
        return id;
    }

function acceptTrade(uint256 tradeId) external {
    AppStorage.Layout storage s = AppStorage.layout();
    AppStorage.Trade storage t = s.trades[tradeId];

    require(t.id != 0, "Trade does not exist");
    require(!t.accepted, "Already accepted");

AppStorage.Item storage itemA = s.items[t.itemA];
AppStorage.Item storage itemB = s.items[t.itemB];

require(itemA.status == AppStorage.ItemStatus.Unlisted, "ItemA not tradable");
require(itemB.status == AppStorage.ItemStatus.Unlisted, "ItemB not tradable");

    require(itemA.id != 0 && itemB.id != 0, "Invalid items");
    require(itemB.owner == msg.sender, "Not owner of itemB");
    require(itemA.owner == t.proposer, "Ownership changed");

    address ownerA = itemA.owner;
    address ownerB = itemB.owner;

    itemA.status = AppStorage.ItemStatus.Unlisted;
    itemB.status = AppStorage.ItemStatus.Unlisted;

    itemA.owner = ownerB;
    itemB.owner = ownerA;

    t.accepted = true;

    emit TradeAccepted(tradeId, msg.sender);
}

    function rateItem(uint256 itemId, uint8 rating) external {
AppStorage.Layout storage s = AppStorage.layout();

require(s.items[itemId].id != 0, "Item does not exist");
require(rating > 0 && rating <= 5, "Invalid rating");
require(s.ratings[itemId][msg.sender] == 0, "Already rated");

s.ratings[itemId][msg.sender] = rating;
    }

    function getItem(uint256 itemId)
        external
        view
        returns (address owner, uint8 itemType, string memory metadataURI, uint256 price, uint8 status)
    {
        AppStorage.Item storage it = AppStorage.layout().items[itemId];
        return (it.owner, it.itemType, it.metadataURI, it.price, uint8(it.status));
    }

function executeMarketplaceFee(uint256 feeBps) external {
    AppStorage.Layout storage s = AppStorage.layout();

    // 🔐 SOLO ejecución interna (DAO)
    require(msg.sender == address(this), "Only DAO");

    require(feeBps <= 1000, "Max 10%");

    s.marketplaceFeeBps = feeBps;
}

function spendTreasury(address to, uint256 amount) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == address(this), "Only DAO");
    require(to != address(0), "Invalid address");
    require(amount > 0, "Invalid amount");

    require(
        s.nudosBalance[address(this)] >= amount,
        "Insufficient treasury"
    );

    s.nudosBalance[address(this)] -= amount;
    s.nudosBalance[to] += amount;
}

}
