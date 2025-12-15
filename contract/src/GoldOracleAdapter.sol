// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

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

    function updateAndGetGoldPrice(
        bytes[] calldata priceUpdateData
    ) external payable returns (uint256) {
        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient fee");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        PythStructs.Price memory p = pyth.getPriceNoOlderThan(
            XAU_USD_PRICE_ID,
            60
        );

        uint256 priceE18 = PythUtils.convertToUint(
            p.price,
            p.expo,
            18
        );

        return priceE18;
    }
}
