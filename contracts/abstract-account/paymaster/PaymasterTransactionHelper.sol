// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";

/**
 * @author Matter Labs
 * @notice Library is used to help custom accounts to work with common methods for the Transaction type.
 */
library PaymasterTransactionHelper {

    /// @notice Calculate the suggested signed hash of the transaction,
    /// i.e. the hash that is signed by EOAs and is recommended to be signed by other accounts.
    function encodePaymasterHash(Transaction calldata _transaction) internal view returns (bytes32 resultHash) {
        if (_transaction.txType == EIP_712_TX_TYPE) {
            resultHash = _encodeHashEIP712Transaction(_transaction);
        } else {
            // Currently no other transaction types are supported.
            // Any new transaction types will be processed in a similar manner.
            revert("Encoding unsupported tx");
        }
    }

    /// @notice Encode hash of the zkSync native transaction type.
    /// @return keccak256 hash of the EIP-712 encoded representation of transaction
    function _encodeHashEIP712Transaction(Transaction calldata _transaction) private view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                TransactionHelper.EIP712_TRANSACTION_TYPE_HASH,
                _transaction.txType,
                _transaction.from,
                _transaction.to,
                _transaction.gasLimit,
                _transaction.gasPerPubdataByteLimit,
                _transaction.maxFeePerGas,
                _transaction.maxPriorityFeePerGas,
                address(0),
                _transaction.nonce,
                _transaction.value,
                EfficientCall.keccak(_transaction.data),
                keccak256(abi.encodePacked(_transaction.factoryDeps)),
                0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 //empty bytes hash
            )
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(TransactionHelper.EIP712_DOMAIN_TYPEHASH, keccak256("zkSync"), keccak256("2"), block.chainid)
        );

        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}
