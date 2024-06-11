# BlockLive Contracts Documentation

## Overview

BlockLive is an event ticketing platform designed to facilitate event management for owners, managers, and users. The platform leverages blockchain technology to provide secure, transparent, and efficient ticket buying and revenue sharing.

## Key Features

1. **Event Management**: Handles all logic related to event ticket buying.
2. **Revenue Sharing**: Splits revenue between event owners.
3. **Off-chain Ticket Purchase**: Allows users to buy tickets off-chain, with BlockLive backend purchasing on behalf of users.
4. **Ticket Types**: Supports various ticket types including VIP, Premium, and Free.
5. **Royalties**: Integrates royalty payments into the ticketing platform.
6. **Discount Codes**: Provides discounts based on discount codes.
7. **Custom Currency**: Allows event owners to decide which token should be used for ticket purchases.

## New Features Integration

### Confidential ERC-20 Ticket Currency

- **Description**: Implement a confidential ERC-20 token which allows attendees to buy tickets without revealing the ticket price.
- **Functionality**:
  - Attendees use a confidential ERC-20 token to purchase tickets.
  - The ticket price remains confidential.

### Additional Lottery Ticket/NFT

- **Description**: Each ticket holder will receive an additional ticket or NFT that includes a lottery feature. On the day of the FHE summit, 5 attendees will receive a prize.
- **Functionality**:
  - Upon ticket purchase, an additional lottery ticket or NFT is issued to the attendee.
  - An external contract manages the lottery and selects 5 winners on the event day.

### Scratch Card for Lottery Winners (Integrated into Event.sol)

- **Description**: Every ticket holder will have a scratch card. After minting the ticket, they can claim a reward if they have won the lottery.
- **Functionality**:
  - Each ticket comes with a scratch card feature.
  - Post-minting, attendees can scratch the card to check if they have won.
  - Winners can claim their rewards.
- **Considerations**:
  - **Farming Risk**: Assess if there is any incentive for users to farm this feature. Measures should be implemented to prevent farming and ensure fair play.

## Contract Code Mapping

The contract code should reflect the functionalities described above. Below is a summary of how the contract code should be structured to include these features:

1. **Event.sol**:
   - Logic for event ticket buying.
   - Revenue splitting between event owners.
   - Handling off-chain ticket purchases.
   - Implementation of different ticket types (VIP, Premium, Free).
   - Royalty management.
   - Discount code functionality.
   - Support for custom currency selection by event owners.
   - Integration of the scratch card feature.

2. **ConfidentialERC20.sol**:
   - Implementation of the confidential ERC-20 token.
   - Methods to handle confidential transactions.

3. **LotteryTicket.sol**:
   - Issuance of additional lottery tickets/NFTs to ticket holders.
   - Integration with an external contract to manage lottery and select winners.

### Example Contract Structure

```plaintext
contracts/
|-- Event.sol
|-- ConfidentialERC20.sol
|-- LotteryTicket.sol
```

## Summary

BlockLive offers a comprehensive event ticketing solution with advanced features such as confidential ticket purchases, lottery-based incentives, and scratch card rewards. By integrating these features, BlockLive aims to enhance user experience and ensure a fair and engaging event participation process. 

## Detailed Feature Integration in Event.sol

### Scratch Card Feature

The scratch card feature will be integrated directly into the `Event.sol` contract. Below is an outline of how this can be structured:

#### Event.sol

- **Ticket Purchase Function**: Handle the logic for buying tickets and issuing scratch cards.
- **Scratch Card Issuance**: Automatically issue a scratch card upon ticket purchase.
- **Scratch Card Checking**: Allow users to check if their scratch card is a winner.
- **Reward Claiming**: Enable winners to claim their rewards.

### Summary
BlockLive offers a comprehensive event ticketing solution with advanced features such as confidential ticket purchases, lottery-based incentives, and scratch card rewards. By integrating these features, BlockLive aims to enhance user experience and ensure a fair and engaging event participation process.
