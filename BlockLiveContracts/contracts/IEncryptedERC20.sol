// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity ^0.8.20;
import "fhevm/lib/TFHE.sol";

interface IEncryptedERC20 {
    function transfer(address to, euint32 amount) external;
    function transferFrom(address from,address to,bytes calldata encryptedAmount) external ;
    function _transferFrom(address from, address to, euint32 amount) external ;
    function returnEncryptedBalanceOfUser(address _userAddress) external view returns (euint32);
    function returnEncryptedAllowanceOfUser(address _owner, address _spender) external view returns (euint32);
    function balanceOfMe() external view returns (euint32);
    function mintAndApprove(address spender, bytes calldata encryptedAmount) external;
}