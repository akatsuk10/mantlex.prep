// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "openzeppelin-contracts/security/ReentrancyGuard.sol";
import "./GoldOracleAdapter.sol";

contract PerpMarket is ReentrancyGuard {
    struct Position {
        int256 size;   
        int256 entryPrice; 
        int256 margin;  
    }

    GoldOracleAdapter public immutable adapter;

    uint256 public constant MIN_MARGIN = 50e18;
    uint256 public constant MAX_LEVERAGE = 20;

    // basis points, 1e4 = 100%
    uint256 public initMarginBps  = 1000;
    uint256 public maintMarginBps = 500; 
    uint256 public takerFeeBps    = 5;  

    mapping(address => Position) public positions;
    uint256 public protocolFees;      
    address public owner;

    event PositionOpened(
        address indexed trader,
        int256 size,
        int256 margin,
        int256 entryPrice,
        uint256 price
    );

    event PositionClosed(
        address indexed trader,
        int256 sizeClosed,
        int256 marginAfter,
        int256 realizedPnl,
        uint256 price
    );

    event Liquidated(
        address indexed trader,
        address indexed liquidator,
        int256 equity,
        uint256 reward,
        uint256 price
    );

    event FeesWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner");
        _;
    }

    constructor(address _adapter) {
        adapter = GoldOracleAdapter(_adapter);
        owner = msg.sender;
    }

    function _abs(int256 x) internal pure returns (int256) {
        return x >= 0 ? x : -x;
    }

    function getPosition(address trader) external view returns (Position memory) {
        return positions[trader];
    }

    // ------------- trading -------------

    /// @notice Open or modify a perp position on XAUT/USD.
    /// @param isLong True for long, false for short.
    /// @param sizeDelta XAUT size change, 1e18.
    /// @param marginDelta MNT to add as margin (1e18).
    /// @dev msg.value must cover both Pyth fee (internal) and marginDelta.
    function openPosition(
        bytes[] calldata priceUpdateData,
        bool isLong,
        uint256 sizeDelta,
        uint256 marginDelta
    ) external payable nonReentrant {
        uint256 priceE18 = adapter.updateAndGetGoldPrice{value: msg.value}(priceUpdateData);

        Position storage pos = positions[msg.sender];

        if (marginDelta > 0) {
            require(msg.value >= marginDelta, "value<margin");
            pos.margin += int256(marginDelta);
        }

        require(sizeDelta > 0, "size=0");

        int256 dSize = isLong ? int256(sizeDelta) : -int256(sizeDelta);
        int256 newSize = pos.size + dSize;

        // taker fee on notional of sizeDelta
        uint256 fee = (sizeDelta * priceE18 * takerFeeBps) / (1e18 * 1e4);
        require(pos.margin > int256(fee), "fee>margin");
        pos.margin -= int256(fee);
        protocolFees += fee;

        // update entry price (weighted average when adding same‑side size)
        if (pos.size == 0 || (pos.size > 0) != (dSize > 0)) {
            pos.entryPrice = int256(priceE18);
        } else {
            int256 oldNotional = (pos.size * pos.entryPrice) / int256(1e18);
            int256 newNotional = (dSize * int256(priceE18)) / int256(1e18);
            pos.entryPrice = (oldNotional + newNotional) * int256(1e18) / newSize;
        }

        pos.size = newSize;

        // leverage + margin checks
        int256 notional = (_abs(pos.size) * int256(priceE18)) / int256(1e18);
        require(pos.margin >= int256(MIN_MARGIN), "min margin");

        require(
            notional * int256(1) <= pos.margin * int256(MAX_LEVERAGE),
            "max lev"
        );

        int256 requiredMargin = (notional * int256(initMarginBps)) / int256(1e4);
        require(pos.margin >= requiredMargin, "init margin");

        emit PositionOpened(msg.sender, pos.size, pos.margin, pos.entryPrice, priceE18);
    }

    /// @notice Close or reduce an existing position.
    function closePosition(
        bytes[] calldata priceUpdateData,
        uint256 sizeDelta
    ) external payable nonReentrant {
        uint256 priceE18 = adapter.updateAndGetGoldPrice{value: msg.value}(priceUpdateData);
        Position storage pos = positions[msg.sender];
        require(pos.size != 0, "no pos");
        require(sizeDelta > 0, "size=0");

        int256 d = pos.size > 0 ? -int256(sizeDelta) : int256(sizeDelta);
        require(_abs(d) <= _abs(pos.size), "too much");

        int256 price = int256(priceE18);

        // realized PnL on portion closed
        int256 pnl = (price - pos.entryPrice) * d / int256(1e18);
        pos.margin += pnl;

        // fee on closed notional
        uint256 fee = (sizeDelta * priceE18 * takerFeeBps) / (1e18 * 1e4);
        require(pos.margin > int256(fee), "fee>margin");
        pos.margin -= int256(fee);
        protocolFees += fee;

        pos.size += d;

        if (pos.size == 0) {
            int256 pay = pos.margin;
            delete positions[msg.sender];
            require(pay > 0, "bankrupt");
            (bool ok, ) = msg.sender.call{value: uint256(pay)}("");
            require(ok, "pay");
        }

        emit PositionClosed(msg.sender, d, pos.margin, pnl, priceE18);
    }

    /// @notice Liquidate an under‑margined position.
    function liquidate(
        address trader,
        bytes[] calldata priceUpdateData
    ) external payable nonReentrant {
        uint256 priceE18 = adapter.updateAndGetGoldPrice{value: msg.value}(priceUpdateData);
        Position storage pos = positions[trader];
        require(pos.size != 0, "no pos");

        int256 price = int256(priceE18);
        int256 notional = (_abs(pos.size) * price) / int256(1e18);
        int256 pnl = (price - pos.entryPrice) * pos.size / int256(1e18);
        int256 equity = pos.margin + pnl;
        int256 maint = (notional * int256(maintMarginBps)) / int256(1e4);

        require(equity < maint, "safe");

        uint256 reward = uint256(equity) / 10;
        uint256 rest = uint256(equity) - reward;

        delete positions[trader];

        (bool ok1, ) = msg.sender.call{value: reward}("");
        require(ok1, "liq reward");
        (bool ok2, ) = owner.call{value: rest}("");
        require(ok2, "liq rest");

        emit Liquidated(trader, msg.sender, equity, reward, priceE18);
    }

    // ------------- admin -------------

    function setParams(
        uint256 _initBps,
        uint256 _maintBps,
        uint256 _takerFeeBps
    ) external onlyOwner {
        require(_initBps >= _maintBps, "init<maint");
        require(_takerFeeBps <= 100, "fee>1%");
        initMarginBps = _initBps;
        maintMarginBps = _maintBps;
        takerFeeBps = _takerFeeBps;
    }

    function withdrawFees(address to, uint256 amount) external onlyOwner {
        require(amount <= protocolFees, "exceeds");
        protocolFees -= amount;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "fees");
        emit FeesWithdrawn(to, amount);
    }

    receive() external payable {}
}
