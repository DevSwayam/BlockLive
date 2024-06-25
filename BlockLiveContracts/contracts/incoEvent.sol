// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {EncryptedERC20} from "./EncryptedERC20.sol";
import "fhevm/lib/TFHE.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";

contract incoEvent is ERC1155, ERC2981, AccessControlEnumerable {
    /**
     * @notice features that are not supported
     * 1. Offchain signing the transaction
     * 2. Discount on tokens
     * 3. Royalty for organisers
     * 4. Revenue distribution for managers
     * 5. Cannot provide different options of currencies
     */

    // State variables
    address public creator;
    string public uribase;
    string public nameContract;
    string public eventDescription;
    string public location;
    uint256 public eventStartTime;
    uint256 public eventEndTime;
    uint32 public ticketPrice;
    euint8 private encryptedRandomNumber;
    uint256 public maxTokenSupply;
    bool public active;
    uint256 public tokenIdCounter;
    address public scratchCardWinnerAddress;
    address public lotteryWinnerAddress;
    mapping(string => EncryptedERC20) public tokenCurrencies;

    mapping(address => uint256) public userToTokenId;
    mapping(uint256 => address) public tokenIdToUserAddress;

    event TokenPurchased(uint256 indexed tokenId, address indexed receiver);
    event ScratchCardWinner(address indexed userAddress, uint256 tokenId);
    event LotteryWinner(address indexed userAddress, uint256 tokenId);

    // @dev Used to sync user address with role
    struct RoleBase {
        address userAddress;
        bytes32 role;
    }

    struct TokenTypeBase {
        string key;
    }

    /// @dev Each type of currency accepted for token purchases
    struct CurrencyBase {
        uint32 price; // Price for the token type
        string currency; // Unique key for the erc20 token used for purchase
        address currencyAddress; // Contract address for the erc20 token used for purchase
    }

    struct Split {
        bool exists;
    }

    struct DiscountBase {
        string key;
    }

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    error Event__AccessDenied();
    error Event__userAlreadyRegisterdForEvent();
    error Event__eventHasAlreadyStarted();
    error Event__hasNotStartedYet();

    constructor(
        address _creator,
        string memory _uribase,
        string memory _nameContract,
        CurrencyBase memory currencyBase,
        string memory _eventDescription,
        string memory _location,
        uint256 _eventStartTime,
        uint256 _eventEndTime,
        uint256 _maxTokenSupply
    ) ERC1155(_uribase) {
        creator = _creator;
        uribase = _uribase;
        nameContract = _nameContract;
        eventDescription = _eventDescription;
        location = _location;
        eventStartTime = _eventStartTime;
        eventEndTime = _eventEndTime;
        maxTokenSupply = _maxTokenSupply;
        active = true;

        // its made only for 255 tickets
        encryptedRandomNumber = TFHE.randEuint8();

        _grantRole(OWNER_ROLE, creator);
        _grantRole(MANAGER_ROLE, creator);

        syncEventData(currencyBase);
    }

    /// @notice Sync all event data
    /// @notice (token types, pricing, discounts)
    /// @dev each will be noop if empty array is passed
    function syncEventData(
        CurrencyBase memory currencyBase
    ) public {
        _onlyManagerOrOwner();
        registerCurrency(currencyBase);
    }

    function registerCurrency(CurrencyBase memory currencyBase) public {
        _onlyManagerOrOwner();
        string memory ckey = currencyBase.currency;
        address caddr = currencyBase.currencyAddress;
        tokenCurrencies[ckey] = EncryptedERC20(caddr);
        ticketPrice = currencyBase.price;
    }

    /// @notice Register roles
    function registerRoles(RoleBase[] memory roles) public {
        _onlyManagerOrOwner();
        for (uint256 i = 0; i < roles.length; i++) {
            _grantRole(roles[i].role, roles[i].userAddress);
        }
    }

    function buyToken(
        address receiver,
        string memory currency,
        bytes memory bytesEncryptedAmount
    ) public {
        address payerAddress = msg.sender;
        _onlyOneTokenPerAddress(receiver);
        _onlyBeforeEventEnds();
        if (!active) {
            revert("Not Active");
        }

        require(
            maxTokenSupply > tokenIdCounter + 1,
            "Max supply for token type"
        );

        euint32 _userBalance = TFHE.asEuint32(bytesEncryptedAmount);

        // requiredTokenAmountToBePaid = then convert the price.value * amount into euint
        euint32 _ticketPrice = TFHE.asEuint32(ticketPrice);
        TFHE.optReq(TFHE.le(_ticketPrice, _userBalance));
        EncryptedERC20 token = tokenCurrencies[currency];
        token.transferFrom(payerAddress, address(this), bytesEncryptedAmount);

        uint256 tokenId = tokenIdCounter;
        tokenIdCounter += 1;

        euint8 encryptedTokenId = TFHE.asEuint8(uint8(tokenId));
        ebool isWinner = TFHE.eq(encryptedTokenId, encryptedRandomNumber);
        if (TFHE.decrypt(isWinner)) {
            // transfer the amount here probablly
            emit ScratchCardWinner(receiver, tokenId);
            scratchCardWinnerAddress = receiver;
        }

        emit TokenPurchased(tokenId, receiver);
        _mint(receiver, tokenId, 1, "");
        userToTokenId[receiver] = tokenId;
        tokenIdToUserAddress[tokenId] = receiver;
    }

    function spinLottery() external {
        _onlyBeforeEventEnds();
        _onlyAfterEventStarts();
        uint256 randomWinnerTokenId = uint256(
            TFHE.decrypt(TFHE.randEuint16()) % tokenIdCounter
        );
        lotteryWinnerAddress = tokenIdToUserAddress[randomWinnerTokenId];
        emit LotteryWinner(lotteryWinnerAddress, randomWinnerTokenId);
    }

    function setURIBase(string memory newuribase) public {
        _onlyManagerOrOwner();
        uribase = newuribase;
    }

    function setURI(string memory newuri) public {
        _onlyManagerOrOwner();
        _setURI(newuri);
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return
            string.concat(
                uribase,
                "/",
                toAsciiString(address(this)),
                "/",
                Strings.toString(_id)
            );
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function setActive(bool _active) public {
        _onlyManagerOrOwner();
        active = _active;
    }

    function setRole(address user, bytes32 role) public {
        _onlyManagerOrOwner();
        _grantRole(role, user);
    }

    function getTokenIdCounter() external view returns (uint256) {
        return tokenIdCounter;
    }

    function removeRole(address user, bytes32 role) public {
        _onlyManagerOrOwner();
        _revokeRole(role, user);
    }

    function _onlyManagerOrOwner() private view {
        if (
            !(hasRole(OWNER_ROLE, msg.sender) ||
                hasRole(MANAGER_ROLE, msg.sender))
        ) {
            revert Event__AccessDenied();
        }
    }

    function _onlyOneTokenPerAddress(address receivingAddress) internal view {
        if (userToTokenId[receivingAddress] != 0) {
            revert Event__userAlreadyRegisterdForEvent();
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControlEnumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _onlyBeforeEventEnds() internal view {
        if (block.timestamp > eventEndTime) {
            revert Event__eventHasAlreadyStarted();
        }
    }

    function _onlyAfterEventStarts() internal view {
        if (block.timestamp < eventStartTime) {
            revert Event__hasNotStartedYet();
        }
    }

    function takeOutRevenue(address revenueReceiver, string memory ckey)
        external
    {
        _onlyManagerOrOwner();
        EncryptedERC20 token = tokenCurrencies[ckey];
        euint32 balanceOfContract = token.balanceOfMe();
        token.transfer(revenueReceiver, balanceOfContract);
    }
}
