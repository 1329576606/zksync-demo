// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract StorageDemo {
    uint256 public slot0;
    uint256 public slot1;
    uint256 public slot2;
    mapping(uint256 => uint256) private slot3Map;

    function setSlot0(uint256 value) public {
        slot0 = value;
    }

    function setSlot1(uint256 value) public {
        slot1 = value;
    }

    function setSlot2(uint256 value) public {
        slot2 = value;
    }

    function getSlot3(uint256 key) public view returns (uint256) {
        return slot3Map[key];
    }

    function setSlot3(uint256 key, uint256 value) public {
        slot3Map[key] = value;
    }
}
