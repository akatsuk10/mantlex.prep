// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PerpMarket.sol"; 

contract DeployPerpMarket is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        address adapter = 0x828a3617302E77e66872A40B458Dc50127160381;

        PerpMarket market = new PerpMarket(adapter);
        console2.log("XautPerpMarketV1:", address(market));

        vm.stopBroadcast();
    }
}
