/**
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

pragma solidity ^0.8.0;

import "./ERC20.sol";

interface IMint {
    function mint(uint256 value) external returns (bool);

    function mintTo(address to, uint256 value) external returns (bool);
}

contract Token is ERC20, IMint {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
    }

    function mint(uint256 value) external returns (bool) {
        balances[msg.sender] += value;
        totalSupply += value;
        emit Transfer(address(0), msg.sender, value);
        return true;
    }

    function mintTo(address to, uint256 value) external returns (bool) {
        balances[to] += value;
        totalSupply += value;
        emit Transfer(address(0), to, value);
        return true;
    }
}
