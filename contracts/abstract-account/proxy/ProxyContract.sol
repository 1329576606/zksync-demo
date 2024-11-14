// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/proxy/Proxy.sol";


contract ProxyContract is Proxy {
    address impl;
    constructor(address _impl) {
        impl = _impl;
    }
    function _implementation() internal view override returns (address) {
        return impl;
    }
}