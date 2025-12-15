// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {GoldOracleAdapter} from "../src/GoldOracleAdapter.sol";

contract GoldOracleAdapterScript is Script {
    GoldOracleAdapter public goldOracleAdapter;

    address constant PYTH_CONTRACT =
        0x98046Bd286715D3B0BC227Dd7a956b83D8978603;
    bytes32 constant XAU_USD_PRICE_ID =
        0x44465e17d2e9d390e70c999d5a11fda4f092847fcd2e3e5aa089d96c98a30e67;

    function setUp() public {}

    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        goldOracleAdapter = new GoldOracleAdapter(
            PYTH_CONTRACT,
            XAU_USD_PRICE_ID
        );

        vm.stopBroadcast();
    }
}
