// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

library EventHelperLibrary {
    using ECDSA for bytes32;

    function _verifySignature(
        address allowedAddress,
        bytes memory signature,
        address signer
    ) public pure returns (bool _isValid) {
        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encode(allowedAddress)))
        );

        return signer == digest.recover(signature);
    }
    function _verifyAddress(
        bytes32[] memory merkleProof,
        bytes32 merkleRoot,
        address receiver
    ) public pure returns (bool) {
        bytes32 leafAddress = keccak256(abi.encodePacked(receiver));
        return MerkleProof.verify(merkleProof, merkleRoot, leafAddress);
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    
}
