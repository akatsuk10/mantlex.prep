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

    GoldOracleAdapter public immutable oracle;

    uint256 public initMarginBps  = 1000;
    uint256 public maintMarginBps = 500;
    uint256 public takerFeeBps    = 5;

    mapping(address => Position) public positions;

    uint256 public protocolFees;
    address public owner;

    event PositionOpened(
        address indexed trader,
        bool isLong,
        uint256 size,
        uint256 margin,
        uint256 price
    );

    event PositionClosed(
        address indexed trader,
        uint256 sizeClosed,
        int256 pnl,
        uint256 price
    );

    event Liquidated(
        address indexed trader,
        address indexed liquidator,
        uint256 reward
    );

    event FeesWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner");
        _;
    }

    constructor(address _oracle) {
        oracle = GoldOracleAdapter(_oracle);
        owner = msg.sender;
    }

    function _abs(int256 x) internal pure returns (uint256) {
        return uint256(x >= 0 ? x : -x);
    }

    function _notionalUsd(int256 size, uint256 price)
        internal
        pure
        returns (uint256)
    {
        return _abs(size) * price / 1e18;
    }

    function _marginUsd(int256 margin) internal pure returns (uint256) {
        return uint256(margin);
    }

    function maxNotional(uint256 marginUsd)
        public
        view
        returns (uint256)
    {
        return (marginUsd * 1e4) / initMarginBps;
    }

    function openPosition(
        bool isLong,
        uint256 sizeDelta,
        uint256 marginDelta
    ) external payable nonReentrant {
        require(sizeDelta > 0, "size=0");
        require(msg.value == marginDelta, "bad value");

        uint256 price = oracle.getGoldPrice();
        Position storage pos = positions[msg.sender];

        pos.margin += int256(marginDelta);

        int256 delta = isLong ? int256(sizeDelta) : -int256(sizeDelta);

        uint256 notionalUsd = sizeDelta * price / 1e18;
        uint256 feeUsd = (notionalUsd * takerFeeBps) / 1e4;

        require(pos.margin >= int256(feeUsd), "fee>margin");

        pos.margin -= int256(feeUsd);
        protocolFees += feeUsd;

        if (pos.size == 0) {
            pos.size = delta;
            pos.entryPrice = int256(price);
        } else if (
            (pos.size > 0 && delta > 0) ||
            (pos.size < 0 && delta < 0)
        ) {
            int256 newSize = pos.size + delta;
            pos.entryPrice =
                (pos.entryPrice * pos.size +
                    int256(price) * delta) /
                newSize;
            pos.size = newSize;
        } else {
            pos.size += delta;
            if (pos.size == 0) pos.entryPrice = 0;
        }

        require(pos.size != 0, "zero");

        uint256 marginUsd = _marginUsd(pos.margin);
        uint256 totalNotional = _notionalUsd(pos.size, price);

        require(
            totalNotional <= maxNotional(marginUsd),
            "max leverage"
        );

        emit PositionOpened(
            msg.sender,
            isLong,
            sizeDelta,
            marginDelta,
            price
        );
    }

    function closePosition(uint256 sizeDelta) external nonReentrant {
        require(sizeDelta > 0, "size=0");

        uint256 price = oracle.getGoldPrice();
        Position storage pos = positions[msg.sender];
        require(pos.size != 0, "no pos");

        int256 delta = pos.size > 0
            ? int256(sizeDelta)
            : -int256(sizeDelta);

        require(_abs(delta) <= _abs(pos.size), "too much");

        int256 pnl =
            (int256(price) - pos.entryPrice) *
            delta /
            int256(1e18);

        pos.margin += pnl;

        uint256 feeUsd =
            (sizeDelta * price / 1e18 * takerFeeBps) / 1e4;

        require(pos.margin >= int256(feeUsd), "fee>margin");

        pos.margin -= int256(feeUsd);
        protocolFees += feeUsd;

        pos.size -= delta;

        if (pos.size == 0) {
            int256 payout = pos.margin;
            delete positions[msg.sender];
            require(payout > 0, "bankrupt");
            payable(msg.sender).transfer(uint256(payout));
        }

        emit PositionClosed(msg.sender, sizeDelta, pnl, price);
    }

    function liquidate(address trader) external nonReentrant {
        uint256 price = oracle.getGoldPrice();
        Position storage pos = positions[trader];
        require(pos.size != 0, "no pos");

        uint256 notional = _notionalUsd(pos.size, price);

        int256 pnl =
            (int256(price) - pos.entryPrice) *
            pos.size /
            int256(1e18);

        int256 equity = pos.margin + pnl;
        require(equity > 0, "bankrupt");

        uint256 maint =
            (notional * maintMarginBps) / 1e4;

        require(uint256(equity) < maint, "safe");

        uint256 reward = uint256(equity) / 10;
        protocolFees += uint256(equity) - reward;

        delete positions[trader];
        payable(msg.sender).transfer(reward);

        emit Liquidated(trader, msg.sender, reward);
    }

    function withdrawFees(address to, uint256 amount)
        external
        onlyOwner
    {
        require(amount <= protocolFees, "exceeds");
        protocolFees -= amount;
        payable(to).transfer(amount);
        emit FeesWithdrawn(to, amount);
    }

    receive() external payable {}
}
