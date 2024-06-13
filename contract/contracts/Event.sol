// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { AccessControlEnumerable } from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import { ERC2981 } from "@openzeppelin/contracts/token/common/ERC2981.sol";
import { DefaultOperatorFilterer } from "operator-filter-registry/src/DefaultOperatorFilterer.sol";
import { IEncryptedERC20 } from "./IEncryptedERC20.sol";
import "fhevm/lib/TFHE.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { EventHelperLibrary } from "./EventHelperLibrary.sol";

/**
 * @title EventTicketManager
 * @notice This contract is used to manage the sale of tokens/tickets for an event.
 * @custom:coauthor spatializes (Blocklive)
 * @custom:coauthor daagcentral (Blocklive)
 * @custom:coauthor aronvis (Blocklive)
 */

contract Event is ERC1155, ERC2981, AccessControlEnumerable, DefaultOperatorFilterer {
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, AccessControlEnumerable, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    enum DiscountType {
        Merkle,
        Signature
    }

    struct TokenPrice {
        bool exists;
        uint32 value;
    }

    /// @dev Register a discount with either a merkle root or signature
    /// @dev DiscountBase contains the non-nested data used to describe the code for updates
    struct DiscountBase {
        bytes32 key; // Key for discount
        bytes32 tokenType; // Token type key to apply discount to
        uint32 value; // Basis points off token price
        int256 maxUsesPerAddress; // Uses for the code per users (-1 inf)
        int256 maxUsesTotal; // Uses for the code for all users (-1 inf)
        DiscountType discountType; // Merkle or Signature based discount
        bytes32 merkleRoot; // Merkle root containing addresses which are allowlisted
        address signer; // Address used to sign discounts off chain
    }
    struct Discount {
        bool exists;
        DiscountBase base;
        uint256 uses;
        mapping(address => uint256) usesPerAddress;
    }

    /// @dev Each type of token to be sold (ex: vip, premium)
    /// @dev TokenTypeBase contains the non-nested data used to describe the token type for updates
    struct TokenTypeBase {
        bytes32 key; // Name of token type
        string displayName; // Name of token type
        int256 maxSupply; // Max number of token of this type (-1 inf)
        bool active; // Token type can be purchased
        bool locked; // Token is soulbound and cannot be transferred
        bool gated; // Token cannot be purchased without a discount
    }

    /// @dev Used to sync user address with role
    struct RoleBase {
        address userAddress;
        bytes32 role;
    }

    /// @dev Live data to track token type details on an active event.
    struct TokenType {
        bool exists;
        TokenTypeBase base;
        // @encryption can be added here
        uint256 purchased; // Number of tokens purchased of this type
        mapping(bytes32 => Discount) discount; // Mapping of discount key to Discount
        mapping(bytes32 => TokenPrice) price; // Mapping of currency key to price
    }

    /// @dev Each type of currency accepted for token purchases
    struct CurrencyBase {
        bytes32 tokenType; // Unique key for the token type
        uint32 price; // Price for the token type
        bytes32 currency; // Unique key for the erc20 token used for purchase
        address currencyAddress; // Contract address for the erc20 token used for purchase
    }

    /// @dev Split token sales between multiple addresses
    struct Split {
        bool exists;
        address withdrawer;
        uint32 percent;
        uint32 base;
    }

    /// @dev Each token sold
    struct Token {
        bool exists;
        bytes32 tokenType; // Map to key of token type
        address owner; // Address of token owner
        bool locked; // Token is soulbound and cannot be transferred
        bool valid; // Token is valid for event entry
    }

    /// Permissions constants
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    /// Contract version
    bytes32 public constant version = "0.7.0";

    /// Public name shown for collection title on marketplaces
    bytes32 public name;

    /// Base URI for metadata reference
    string private _uriBase;

    /// Event is active and tokens can be purchased
    bool public active;

    // Limit of tokens per person per order total
    uint256 public orderLimit = 5;

    // Limit of tokens per contract allowed
    int256 public totalMaxSupply = -1;

    /// Mapping from token ID to its details
    mapping(uint256 => Token) private _tokenRegistry;

    /// Mapping of token key to token type
    mapping(bytes32 => TokenType) private _tokenTypeRegistry;

    Split[] public splitRegistry;

    /// Mapping from currency name to its ERC20 address
    // @encrypted-erc20 change need to be added here IEncryptedErc20 will come
    mapping(bytes32 => IEncryptedERC20) public tokenCurrencies;

    // All currency keys for iteration
    bytes32[] private currencyKeys;

    /// Latest token id
    uint256 public tokenIdCounter;

    event TokenPurchased(uint256 indexed tokenId, bytes32 indexed tokenType);

    // Custom Errors
    error Event__AccessDenied();
    error Event__EventIsNotActive();
    error Event__ArgumentsLengthMismatched();
    error Event__NotEnoughBalanceForBatch();
    error Event__MaxSupplyForTokenType();
    error Event__MaxSupplyForContract();
    error Event__ExceedsLimit();
    error Event__CurrencyIsNotRegistered();
    error Event__TokenTypeIsNotRegistered();
    error Event__TokenTypeIsGated();
    error Event__NotOnAllowedSignatureList();
    error Event__NotOnMerkleAllowList();
    error Event__InvalidDiscountType();
    error Event__MaxTotalUsesReached();
    error Event__MaxTotalUsersUsesReached();
    error Event__DiscountExceedsPrize();
    error Event__OnlyOwner();
    error Event__SplitsMustBeSame();
    error Event__SplitMustAddUpToThousandPercentage();
    error Event__NotEnoughBalance();
    error Event__TokenIsLocked();
    error Event__TokenTypeIsLocked();
    error Event__EventIsAlreadyStarted();

    constructor(
        address creator,
        string memory uribase,
        bytes32 nameContract,
        TokenTypeBase[] memory tokenTypeBase,
        CurrencyBase[] memory currencyBase,
        DiscountBase[] memory discountBase,
        Split[] memory splits,
        RoleBase[] memory roles
    ) ERC1155(uribase) {
        name = nameContract;

        /// @notice Assign creator to be owner
        _grantRole(OWNER_ROLE, creator);
        _grantRole(MANAGER_ROLE, creator);

        _uriBase = uribase;
        active = true;

        /// @notice Initialze default split registry with 100% to creator
        splitRegistry.push(Split(true, creator, 1, 1));

        /// @notice Initialize royalties for ERC2981
        // 1000 => 10%
        _setDefaultRoyalty(creator, 1000);

        /// @notice Initialize token types, currencies, discounts, splits
        syncEventData(tokenTypeBase, currencyBase, discountBase, splits, roles);
    }

    function setURIBase(string memory newuribase) public {
        _onlyManagerOrOwner();
        _uriBase = newuribase;
    }

    function setURI(string memory newuri) public {
        _onlyManagerOrOwner();
        _setURI(newuri);
    }

    function setDefaultRoyalty(address _receiver, uint96 _feeNumerator) public {
        _onlyManagerOrOwner();
        _setDefaultRoyalty(_receiver, _feeNumerator);
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return
            string.concat(_uriBase, "/", EventHelperLibrary.toAsciiString(address(this)), "/", Strings.toString(_id));
    }

    function isNative(bytes32 currency) private pure returns (bool) {
        return keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked("native"));
    }

    function buyToken(
        bytes32 _tokenType,
        uint32 amount,
        address receiver,
        bytes32 currency
    ) public payable {
        buyToken(_tokenType, amount, receiver, currency, address(0), "", new bytes32[](0), "");
    }

    /// @notice Purchase multiple tokens in a single txn
    function buyToken(
        bytes32[] memory _tokenType,
        uint32[] memory amount,
        address[] memory receiver,
        bytes32[] memory currency,
        address[] memory payer,
        bytes32[] memory discountCode,
        bytes32[][] memory merkleProof,
        bytes[] memory signature
    ) public payable onlyWhenActive {
        if (
            !(_tokenType.length == amount.length &&
                _tokenType.length == receiver.length &&
                _tokenType.length == currency.length &&
                _tokenType.length == payer.length &&
                _tokenType.length == discountCode.length &&
                _tokenType.length == merkleProof.length &&
                _tokenType.length == signature.length)
        ) {
            revert Event__ArgumentsLengthMismatched();
        }

        uint256 purchaseTotal = 0;

        for (uint256 i = 0; i < _tokenType.length; i++) {
            uint32 price = buyToken(
                _tokenType[i],
                amount[i],
                receiver[i],
                currency[i],
                payer[i],
                discountCode[i],
                merkleProof[i],
                signature[i]
            );
            if (isNative(currency[i])) {
                purchaseTotal += price;
            }
        }

        if (!(hasRole(OWNER_ROLE, msg.sender) || msg.value >= purchaseTotal)) {
            revert Event__NotEnoughBalanceForBatch();
        }
    }

    /// @notice Purchase a token
    function buyToken(
        bytes32 _tokenType, // Unique key for  type to be priced against
        uint32 amount, // Amount to purchase multiple copies of a single token ID
        address receiver, // Address to receive the token
        bytes32 currency, // Currency to be used for purchase
        address payer, // Address to pay for the token when ERC20
        bytes32 discountCode, // Discount code to be applied
        bytes32[] memory merkleProof, // Merkle proof for discount
        bytes memory signature // Signature for discount
    ) public payable onlyWhenActive returns (uint32) {
        address payerAddress = payer != address(0) ? payer : msg.sender;

        int256 maxSupply = _tokenTypeRegistry[_tokenType].base.maxSupply;
        if (!(maxSupply < 0 || _tokenTypeRegistry[_tokenType].purchased + amount <= uint256(maxSupply))) {
            revert Event__MaxSupplyForTokenType();
        }
        if (!(totalMaxSupply < 0 || tokenIdCounter + amount <= uint256(totalMaxSupply))) {
            revert Event__MaxSupplyForContract();
        }
        if (!(amount < orderLimit)) {
            revert Event__ExceedsLimit();
        }
        if (!(_tokenTypeRegistry[_tokenType].base.active)) {
            revert Event__EventIsNotActive();
        }
        if (!(isNative(currency) || address(tokenCurrencies[currency]) != address(0))) {
            revert Event__CurrencyIsNotRegistered();
        }
        if (!(_tokenTypeRegistry[_tokenType].price[currency].exists)) {
            revert Event__TokenTypeIsNotRegistered();
        }

        TokenPrice memory price = _tokenTypeRegistry[_tokenType].price[currency];
        Discount storage discount = _tokenTypeRegistry[_tokenType].discount[discountCode];

        if (_tokenTypeRegistry[_tokenType].base.gated && !discount.exists && !hasRole(OWNER_ROLE, msg.sender)) {
            revert Event__TokenTypeIsGated();
        }

        if (discount.exists) {
            if (discount.base.discountType == DiscountType.Signature) {
                if (!(EventHelperLibrary._verifySignature(receiver, signature, discount.base.signer))) {
                    revert Event__NotOnAllowedSignatureList();
                }
            } else if (discount.base.discountType == DiscountType.Merkle) {
                if (!(EventHelperLibrary._verifyAddress(merkleProof, discount.base.merkleRoot, receiver))) {
                    revert Event__NotOnMerkleAllowList();
                }
            } else {
                revert Event__InvalidDiscountType();
            }

            uint32 discountValue = (price.value * discount.base.value) / 10000;

            // Ensure the discounted price does not underflow
            if (!(discountValue <= price.value)) {
                revert Event__DiscountExceedsPrize();
            }

            // Update the price.value with the new discounted price
            price.value = price.value - discountValue;

            int256 maxUsesTotal = discount.base.maxUsesTotal;
            int256 maxUsesPerAddress = discount.base.maxUsesPerAddress;
            if (!(maxUsesTotal < 0 || discount.uses + amount <= uint256(maxUsesTotal))) {
                revert Event__MaxTotalUsesReached();
            }

            if (!(maxUsesPerAddress < 0 || discount.usesPerAddress[receiver] + amount <= uint256(maxUsesPerAddress))) {
                revert Event__MaxTotalUsersUsesReached();
            }

            discount.uses += 1;
            discount.usesPerAddress[receiver] += 1;
        }

        if (isNative(currency)) {
            if (!(hasRole(OWNER_ROLE, msg.sender) || msg.value >= price.value * amount)) {
                revert Event__NotEnoughBalance();
            }
        } else {
            if (!hasRole(OWNER_ROLE, msg.sender)) {
                // requiredTokenAmountToBePaid = then convert the price.value * amount into euint
                euint32 _ticketPrice = TFHE.asEuint32(price.value * amount);

                // Balance Check
                euint32 _payerBalance = tokenCurrencies[currency].returnEncryptedBalanceOfUser(payerAddress);
                TFHE.optReq(TFHE.le(_ticketPrice, _payerBalance));

                // Allowance Check
                euint32 _payerAllowance = tokenCurrencies[currency].returnEncryptedAllowanceOfUser(
                    payerAddress,
                    address(this)
                );
                TFHE.optReq(TFHE.le(_ticketPrice, _payerAllowance));

                // Also give approval to this contract to pull funds on behalf of user
                tokenCurrencies[currency].transferFrom(payerAddress, address(this), _ticketPrice);
            }
        }

        uint256 tokenId = tokenIdCounter;
        tokenIdCounter += 1;

        _tokenTypeRegistry[_tokenType].purchased += 1;

        _tokenRegistry[tokenId].tokenType = _tokenType;

        emit TokenPurchased(tokenId, _tokenType);
        _mint(receiver, tokenId, 1, "");

        return price.value;
    }

    /// @notice Register token types
    /// @param tokenTypeBase Array of token type base structs
    function registerTokenType(TokenTypeBase[] memory tokenTypeBase) public {
        _onlyManagerOrOwner();
        for (uint256 i = 0; i < tokenTypeBase.length; i++) {
            TokenType storage _tokenType = _tokenTypeRegistry[tokenTypeBase[i].key];
            _tokenType.base = tokenTypeBase[i];
            _tokenType.exists = true;
        }
    }

    /// @notice Register a currency to be accepted for a token type and price
    /// @param currencyBase Array of currency base structs
    function registerCurrency(CurrencyBase[] memory currencyBase) public {
        _onlyManagerOrOwner();
        for (uint256 i = 0; i < currencyBase.length; i++) {
            TokenType storage _tokenType = _tokenTypeRegistry[currencyBase[i].tokenType];
            bytes32 ckey = currencyBase[i].currency;
            address caddr = currencyBase[i].currencyAddress;
            if (!(_tokenType.exists)) {
                revert Event__TokenTypeIsNotRegistered();
            }

            _tokenType.price[ckey] = TokenPrice(true, currencyBase[i].price);

            if (caddr != address(0) && tokenCurrencies[ckey] != IEncryptedERC20(caddr)) {
                // @encrypted-erc20 change
                tokenCurrencies[ckey] = IEncryptedERC20(caddr);
                currencyKeys.push(ckey);
            }
        }
    }

    /// @notice Register a discount for an event
    /// @param discountBase Base input discount data
    function registerDiscount(DiscountBase[] memory discountBase) public {
        _onlyManagerOrOwner();
        for (uint256 i = 0; i < discountBase.length; i++) {
            Discount storage discount = _tokenTypeRegistry[discountBase[i].tokenType].discount[discountBase[i].key];
            discount.base = discountBase[i];
            discount.exists = true;
        }
    }

    function setRole(address user, bytes32 role) public {
        _onlyManagerOrOwner();
        _grantRole(role, user);
    }

    function removeRole(address user, bytes32 role) public {
        _onlyManagerOrOwner();
        _revokeRole(role, user);
    }

    function setActive(bool _active) public {
        _onlyManagerOrOwner();
        active = _active;
    }

    function setLimit(uint256 limit) public {
        _onlyManagerOrOwner();
        orderLimit = limit;
    }

    function setTotalMaxSupply(int256 _totalMaxSupply) external {
        _onlyManagerOrOwner();
        totalMaxSupply = _totalMaxSupply;
    }

    /// @notice Token Type Registry helpers
    function tokenActive(bytes32 _tokenType) external view returns (bool) {
        return _tokenTypeRegistry[_tokenType].base.active;
    }

    function tokenAmounts(bytes32 _tokenType) external view returns (int256) {
        return _tokenTypeRegistry[_tokenType].base.maxSupply;
    }

    function tokensPurchased(bytes32 _tokenType) external view returns (uint256) {
        return _tokenTypeRegistry[_tokenType].purchased;
    }

    /// @notice Token Registry helpers
    function owned(uint256 tokenId) external view returns (address) {
        return _tokenRegistry[tokenId].owner;
    }

    function tokenType(uint256 tokenId) external view returns (bytes32) {
        return _tokenRegistry[tokenId].tokenType;
    }

    function tokenLocked(uint256 tokenId) public view returns (bool) {
        return _tokenRegistry[tokenId].locked;
    }

    function setTokenLock(uint256 tokenId, bool locked) public {
        _onlyManagerOrOwner();
        _tokenRegistry[tokenId].locked = locked;
    }

    /// @notice Register roles
    function registerRoles(RoleBase[] memory roles) public  {
        _onlyManagerOrOwner();
        for (uint256 i = 0; i < roles.length; i++) {
            _grantRole(roles[i].role, roles[i].userAddress);
        }
    }

    /// @notice Address splits for withdraws from the contract
    function getSplits() external view returns (Split[] memory) {
        return splitRegistry;
    }

    function registerSplits(Split[] memory splits) public {
        _onlyManagerOrOwner();
        if (splits.length < 1) {
            return;
        }

        // Always register fresh splits
        delete splitRegistry;

        uint256 base = splits[0].base;
        uint256 total = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            total += splits[i].percent;
            splitRegistry.push(splits[i]);
            if (!(splits[i].base == base)) {
                revert Event__SplitsMustBeSame();
            }
        }
        if (!(total / base == 1)) {
            revert Event__SplitMustAddUpToThousandPercentage();
        }
    }

    function sweep(bytes32 currency, Split[] memory splits) internal {
        if (keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked("native"))) {
            uint256 _balance = address(this).balance;
            for (uint i = 0; i < splits.length; i++) {
                uint256 splitBalance = (_balance * splits[i].percent) / splits[i].base;
                payable(splits[i].withdrawer).transfer(splitBalance);
            }
        } else {
            IEncryptedERC20 token = tokenCurrencies[currency];
            euint32 _balance = token.returnEncryptedBalanceOfUser(address(this));
            uint32 _balanceOfContract = TFHE.decrypt(_balance);
            for (uint i = 0; i < splits.length; i++) {
                euint32 splitBalance = TFHE.asEuint32((_balanceOfContract * splits[i].percent) / splits[i].base);
                token.transfer(splits[i].withdrawer, splitBalance);
            }
        }
    }

    function sweepSplit(bytes32 currency) public {
        _onlyManagerOrOwner();
        sweep(currency, splitRegistry);
    }

    /// @notice Full sweep for the manager as backup if the split registry is corrupted
    function sweepAll(address sweeper) public {
        if (!(hasRole(OWNER_ROLE, msg.sender))) {
            revert Event__OnlyOwner();
        }

        Split[] memory splits = new Split[](1);
        splits[0] = Split(true, sweeper, 1, 1);

        // Sweep all erc20 tokens
        for (uint256 i = 0; i < currencyKeys.length; i++) {
            bytes32 ckey = currencyKeys[i];
            sweep(ckey, splits);
        }

        // Sweep native currency
        sweep("native", splits);
    }

    /// @notice Sync all event data
    /// @notice (token types, pricing, discounts)
    /// @dev each will be noop if empty array is passed
    function syncEventData(
        TokenTypeBase[] memory tokenTypeBase,
        CurrencyBase[] memory currencyBase,
        DiscountBase[] memory discountBase,
        Split[] memory splits,
        RoleBase[] memory roles
    ) public  {
        _onlyManagerOrOwner();
        registerTokenType(tokenTypeBase);
        registerCurrency(currencyBase);
        registerDiscount(discountBase);
        registerSplits(splits);
        registerRoles(roles);
    }

    function rescueToken(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        _onlyManagerOrOwner();
        _safeTransferFrom(from, to, id, amount, data);
    }

    /// @notice Call for offchain updates to metadata json
    function metadataUpdated(uint256 tokenId) public {
        _onlyManagerOrOwner();
        emit URI(uri(tokenId), tokenId);
    }

    // Dev removed one function and also remove a require from below
    function renounceAccessControl() public {
        if (!(hasRole(OWNER_ROLE, msg.sender))) {
            revert Event__OnlyOwner();
        }
        if (!(tokenIdCounter == 0)) {
            revert Event__EventIsAlreadyStarted();
        }
        bytes32[2] memory roles = [OWNER_ROLE, MANAGER_ROLE];

        for (uint256 r = 0; r < roles.length; r++) {
            for (uint256 m = 0; m < getRoleMemberCount(roles[r]); m++) {
                revokeRole(roles[r], getRoleMember(roles[r], m));
            }
        }
    }

    /// Overrides
    /// @notice Keep the list of owners up to date on all transfers, mints, burns
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual {
        // To run **after** the transfer
        super._beforeTokenTransfer(msg.sender, from, to, ids, values, "");
        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            _tokenRegistry[id].owner = to;
        }
        super._afterTokenTransfer(msg.sender, from, to, ids, values, "");
    }

    /// Ensure token and token type are both unlocked
    function checkOnlyUnlocked(uint256 tokenId) public view {
        /// Check token is not locked
        if (!(_tokenRegistry[tokenId].locked == false)) {
            revert Event__TokenIsLocked();
        }

        /// Check token type is not locked
        if (!(_tokenTypeRegistry[_tokenRegistry[tokenId].tokenType].base.locked == false)) {
            revert Event__TokenTypeIsLocked();
        }
    }

    /// @notice modifier to block batch transfers when token is locked
    modifier onlyUnlockedBatch(uint256[] memory tokenId) {
        /// Check all tokens, only allow if all are unlocked
        for (uint256 i = 0; i < tokenId.length; ++i) {
            checkOnlyUnlocked(tokenId[i]);
        }
        _;
    }

    /// @notice modifier to block transfers when token is locked
    modifier onlyUnlocked(uint256 tokenId) {
        /// Check all tokens, only allow if all are unlocked
        checkOnlyUnlocked(tokenId);
        _;
    }
    
    function _onlyManagerOrOwner() private view{
        if (!(hasRole(OWNER_ROLE, msg.sender) || hasRole(MANAGER_ROLE, msg.sender))) {
            revert Event__AccessDenied();
        }
    }

    modifier onlyWhenActive() {
        if (!active) {
            revert Event__EventIsNotActive();
        }
        _;
    }

    /// @notice Filter registry from OpenSea.
    /// @dev See {IERC1155-setApprovalForAll}.
    /// @dev In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
    function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    /// @dev See {IERC1155-safeTransferFrom}.
    /// @dev In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) public override onlyAllowedOperator(from) onlyUnlocked(tokenId) {
        super.safeTransferFrom(from, to, tokenId, amount, data);
    }

    /// @dev See {IERC1155-safeBatchTransferFrom}.
    /// @dev In this example the added modifier ensures that the operator is allowed by the OperatorFilterRegistry.
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override onlyAllowedOperator(from) onlyUnlockedBatch(ids) {
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
}
