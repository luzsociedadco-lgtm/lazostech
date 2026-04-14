// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {ITicketsModule} from "src/interfaces/modules/ITicketsModule.sol";

contract TicketsFacet is ITicketsModule {
    event TicketsMinted(address indexed to, uint256 amount, uint256 indexed ticketType, address operator);
    event TicketsTransferred(address indexed from, address indexed to, uint256 amount);
    event TicketsUsed(address indexed user, uint256 amount);
    event TicketsRedeemed(address indexed user, uint256 tickets, uint256 nudosSpent);
    event TicketsPurchasedFiat(address indexed user, uint256 amount, address operator);
    event TicketBalanceChanged(address indexed user, uint256 newBalance);
    event FiatTicketGrantTracked(address indexed operator, address indexed user, uint256 amount);

    // ----------------------------
    // REDEEM NUDOS FOR TICKET
    // ----------------------------
    function redeemTickets(uint256 ticketsAmount) external {
        AppStorage.Layout storage s = AppStorage.layout();
        uint256 requiredNudos = ticketsAmount * s.nudosPerTicket;
        require(s.nudosBalance[msg.sender] >= requiredNudos, "Insufficient NUDOS");
	require(ticketsAmount > 0, "Invalid amount");

        // Descontar NUDOS
        s.nudosBalance[msg.sender] -= requiredNudos;
	s.nudosBalance[address(this)] += requiredNudos;

        // Agregar tickets
        s.ticketBalance[msg.sender] += ticketsAmount;

	emit TicketBalanceChanged(msg.sender, s.ticketBalance[msg.sender]);
        emit TicketsRedeemed(msg.sender, ticketsAmount, requiredNudos);
    }

    // ----------------------------
    // MINT TICKET (cumple con ITicketsModule)
    // ----------------------------
function mintTicket(address to, uint256 ticketType, uint256 amount)
    external
    override
{
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.isUniversityStaff[msg.sender], "Only university staff");
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Invalid amount");

    s.ticketBalance[to] += amount;

    emit TicketsMinted(to, amount, ticketType, msg.sender);
    emit TicketBalanceChanged(to, s.ticketBalance[to]);
}

    // ----------------------------
    // TRANSFER TICKET (cumple con ITicketsModule)
    // ----------------------------
function transferTicket(address from, address to, uint256 amount)
    external
    override
{
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == from, "Not owner");
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Invalid amount");
    require(s.ticketBalance[from] >= amount, "Insufficient tickets");

    s.ticketBalance[from] -= amount;
    s.ticketBalance[to] += amount;

    emit TicketsTransferred(from, to, amount);
    emit TicketBalanceChanged(from, s.ticketBalance[from]);
    emit TicketBalanceChanged(to, s.ticketBalance[to]);
}


    // ----------------------------
    // USE TICKET (cumple con ITicketsModule)
    // ----------------------------

function useTicket(address user, uint256 ticketType, uint256 amount)
    external
    override
{
	ticketType;

    AppStorage.Layout storage s = AppStorage.layout();

    require(s.isUniversityStaff[msg.sender], "Only authorized operator");
    require(user != address(0), "Invalid user");
    require(amount > 0, "Invalid amount");
    require(s.ticketBalance[user] >= amount, "Insufficient tickets");

    s.ticketBalance[user] -= amount;

    emit TicketsUsed(user, amount);
    emit TicketBalanceChanged(user, s.ticketBalance[user]);
}

    // ----------------------------
    // VIEW FUNCTION
    // ----------------------------
    function getTickets(address user) external view returns (uint256) {
        return AppStorage.layout().ticketBalance[user];
    }

function grantTicketsFromFiat(address user, uint256 amount) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.isUniversityStaff[msg.sender], "Only university staff");
    require(user != address(0), "Invalid user");
    require(amount > 0, "Invalid amount");
    require(amount <= 100, "Excessive ticket grant");

    s.ticketBalance[user] += amount;

    emit TicketsPurchasedFiat(user, amount, msg.sender);
    emit FiatTicketGrantTracked(msg.sender, user, amount);
    emit TicketBalanceChanged(user, s.ticketBalance[user]);
}

}
