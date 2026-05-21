// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {ITicketsModule} from "src/interfaces/modules/ITicketsModule.sol";
import {IERC20Minimal} from "src/interfaces/core/IERC20Minimal.sol";

contract TicketsFacet is ITicketsModule {
    event TicketsMinted(address indexed to, uint256 amount, uint256 indexed ticketType, address operator);
    event TicketsTransferred(address indexed from, address indexed to, uint256 amount);
    event TicketsUsed(address indexed user, uint256 amount);
    event TicketsRedeemed(address indexed user, uint256 tickets, uint256 nudosSpent);
    event TicketsRedemptionRequested(
        address indexed user,
        uint256 tickets,
        uint256 nudosSpent,
        bytes32 indexed orderHash
    );
    event TicketsPurchasedFiat(address indexed user, uint256 amount, address operator);
    event TicketBalanceChanged(address indexed user, uint256 newBalance);
    event FiatTicketGrantTracked(address indexed operator, address indexed user, uint256 amount);

    function redeemTickets(uint256 ticketsAmount) external {
        _redeemTickets(ticketsAmount, bytes32(0));
    }

    function redeemTicketsForOrder(uint256 ticketsAmount, bytes32 orderHash) external {
        require(orderHash != bytes32(0), "Order hash required");
        _redeemTickets(ticketsAmount, orderHash);
    }

    function quoteTicketRedemption(uint256 ticketsAmount) external view returns (uint256) {
        return ticketsAmount * AppStorage.layout().nudosPerTicket * 1 ether;
    }

    function _redeemTickets(uint256 ticketsAmount, bytes32 orderHash) internal {
        AppStorage.Layout storage s = AppStorage.layout();

        require(ticketsAmount > 0, "Invalid amount");
        require(s.token != address(0), "Token not set");

        uint256 requiredNudos = ticketsAmount * s.nudosPerTicket * 1 ether;

        if (orderHash != bytes32(0)) {
            require(!s.processedTicketOrders[orderHash], "Order already processed");
            s.processedTicketOrders[orderHash] = true;
        }

        require(
            IERC20Minimal(s.token).transferFrom(msg.sender, address(this), requiredNudos),
            "Token payment failed"
        );

        emit TicketsRedeemed(msg.sender, ticketsAmount, requiredNudos);
        emit TicketsRedemptionRequested(msg.sender, ticketsAmount, requiredNudos, orderHash);
    }

    function mintTicket(address to, uint256 ticketType, uint256 amount) external override {
        to;
        ticketType;
        amount;
        revert("Tickets are managed off-chain");
    }

    function transferTicket(address from, address to, uint256 amount) external override {
        from;
        to;
        amount;
        revert("Tickets are managed off-chain");
    }

    function useTicket(address user, uint256 ticketType, uint256 amount) external override {
        user;
        ticketType;
        amount;
        revert("Tickets are managed off-chain");
    }

    function getTickets(address user) external view returns (uint256) {
        user;
        // Legacy compatibility view. The source of truth now lives off-chain.
        return 0;
    }

    function grantTicketsFromFiat(address user, uint256 amount) external {
        user;
        amount;
        revert("Tickets are managed off-chain");
    }
}
