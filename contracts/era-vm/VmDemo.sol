// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract VmDemo {
    event ValueSet(uint256 indexed value);
    event ValueGet(uint256 indexed value);

    uint256 private slot0;

    function setSlot0(uint256 value) public {
        slot0 = value;
        emit ValueSet(value);
    }

    function getSlot0() public returns (uint256) {
        emit ValueGet(slot0);
        return slot0;
    }
}
