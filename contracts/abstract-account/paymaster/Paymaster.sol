
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, PaymasterTransactionHelper} from "./PaymasterTransactionHelper.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Paymaster is IPaymaster {
    // to get transaction hash
    using PaymasterTransactionHelper for Transaction;
    using TransactionHelper for Transaction;

    uint256 constant PRICE_FOR_PAYING_FEES = 1;
    address public owner;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continue execution if called from the bootloader.
        _;
    }

    constructor(address _owner) payable {
        owner = _owner;
    }

    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        (bool success,) = owner.call{value: address(this).balance}('');
        require(success, 'Transfer fail');
    }

    function validateAndPayForPaymasterTransaction(
        bytes32,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    )
    external
    payable
    onlyBootloader
    returns (bytes4 magic, bytes memory context)
    {
        bytes32 txHash = _transaction.encodePaymasterHash();

        // By default we consider the transaction as accepted.
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;

        require(
            _transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long"
        );

        bytes4 paymasterInputSelector = bytes4(
            _transaction.paymasterInput[0 : 4]
        );

        if (paymasterInputSelector == IPaymasterFlow.general.selector) {

            (bytes memory signature) = abi.decode(
                _transaction.paymasterInput[4 :],
                (bytes)
            );

            (address recoveredAddr, ECDSA.RecoverError error) = ECDSA.tryRecover(txHash, signature);

            if (error != ECDSA.RecoverError.NoError || recoveredAddr != owner) {
                magic = bytes4(0);
                return (magic, context);
            }
            _transaction.payToTheBootloader();
        } else {
            revert("Unsupported paymaster flow");
        }
    }

    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable override onlyBootloader {
        // Refunds are not supported yet.
    }

    receive() external payable {}
}
