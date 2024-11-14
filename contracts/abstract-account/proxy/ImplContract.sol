// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;


contract ImplContract {
    uint256 immutable public value;

    constructor(uint256 _value) {
        value = _value;
    }
}