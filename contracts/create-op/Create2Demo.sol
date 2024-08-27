// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Create2.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MockContract {
    uint256 public id;
    constructor(uint256 _id) {
        id = _id;
    }
}

contract Create2Demo {
    event Created(uint256 indexed id, address indexed addr);

    function create(uint256 id) public returns (address addr) {
        bytes32 salt = bytes32(id);
        addr = Create2.deploy(0, salt, abi.encodePacked(type(MockContract).creationCode, abi.encode(id)));
        emit Created(id, addr);
    }

    function computeAddress(uint256 id) public view returns (address addr) {
        bytes32 salt = bytes32(id);
        addr = Create2.computeAddress(salt, keccak256(abi.encodePacked(type(MockContract).creationCode, abi.encode(id))));
    }
}
