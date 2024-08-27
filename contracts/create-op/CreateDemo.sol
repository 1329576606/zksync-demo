// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract MockContract {
    uint256 public id;
    constructor(uint256 _id) {
        id = _id;
    }
}

contract CreateDemo {
    event Created(uint256 indexed id, address indexed addr);

    function create(uint256 id) public returns (address) {
        MockContract mock = new MockContract(id);
        emit Created(id, address(mock));
        return address(mock);
    }
}
