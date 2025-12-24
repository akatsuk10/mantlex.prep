// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "@pythnetwork/pyth-sdk-solidity/PythUtils.sol";

contract GoldOracleAdapter {
    IPyth public immutable pyth;
    bytes32 public immutable XAU_USD_PRICE_ID;

    constructor(address _pyth, bytes32 _xauUsdPriceId) {
        pyth = IPyth(_pyth);
        XAU_USD_PRICE_ID = _xauUsdPriceId;
    }

    function getGoldPrice() external view returns (uint256) {
        PythStructs.Price memory p = pyth.getPriceUnsafe(XAU_USD_PRICE_ID);
        return PythUtils.convertToUint(p.price, p.expo, 18);
    }
}
