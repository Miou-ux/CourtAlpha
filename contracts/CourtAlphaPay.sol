// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CourtAlphaPay — paiement ETH one-shot avec référence commande
contract CourtAlphaPay {
    address public immutable owner;

    event Paid(bytes32 indexed paymentRef, address indexed payer, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function pay(bytes32 paymentRef) external payable {
        require(msg.value > 0, "amount required");
        emit Paid(paymentRef, msg.sender, msg.value);
    }

    function withdraw(address to) external {
        require(msg.sender == owner, "not owner");
        require(to != address(0), "zero address");
        payable(to).transfer(address(this).balance);
    }
}
