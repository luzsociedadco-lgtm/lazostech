// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {IERC20Minimal} from "src/interfaces/core/IERC20Minimal.sol";

contract RewardFacet {
    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view {
        require(msg.sender == AppStorage.layout().owner, "RewardFacet: NOT_OWNER");
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event RewardGranted(address indexed user, uint256 amount, uint256 newBalance);
    event TokenUpdated(address indexed token);
    event RecycleRateUpdated(bytes32 indexed material, uint256 rate);
    event RewardBaseUnitUpdated(uint256 value);

    /*//////////////////////////////////////////////////////////////
                                ADMIN
    //////////////////////////////////////////////////////////////*/
    function setRewardToken(address token) external onlyOwner {
        require(token != address(0), "RewardFacet: ZERO_ADDRESS");
        AppStorage.layout().token = token;
        emit TokenUpdated(token);
    }

    function setRecycleRate(AppStorage.Material material, uint256 rate) external onlyOwner {
        require(rate > 0, "RewardFacet: ZERO_RATE");

        AppStorage.layout().recycleRates[material] = rate;

        emit RecycleRateUpdated(bytes32(uint256(material)), rate);
    }

    function setRewardBaseUnit(uint256 value) external onlyOwner {
        require(value > 0, "RewardFacet: ZERO_BASE_UNIT");
        AppStorage.layout().rewardBaseUnit = value;
        emit RewardBaseUnitUpdated(value);
    }

    /*//////////////////////////////////////////////////////////////
                                REWARDS
    //////////////////////////////////////////////////////////////*/
    function grantReward(address user, uint256 amount) external {
        AppStorage.Layout storage s = AppStorage.layout();

        require(msg.sender == address(this) || s.recyclingOracles[msg.sender], "RewardFacet: NOT_AUTHORIZED");

        require(user != address(0), "RewardFacet: ZERO_USER");
        require(amount > 0, "RewardFacet: ZERO_AMOUNT");
        require(s.token != address(0), "RewardFacet: TOKEN_NOT_SET");

        uint256 maxReward = 100 ether;
        require(amount <= maxReward, "RewardFacet: MAX_REWARD_EXCEEDED");

        IERC20Minimal token = IERC20Minimal(s.token);
        require(token.balanceOf(address(this)) >= amount, "RewardFacet: INSUFFICIENT_TREASURY");
        require(token.transfer(user, amount), "RewardFacet: TRANSFER_FAILED");

        s.nudosAccumulated[user] += amount;
        uint256 newBalance = token.balanceOf(user);

        emit RewardGranted(user, amount, newBalance);
    }

    /*//////////////////////////////////////////////////////////////
                                VIEWS
    //////////////////////////////////////////////////////////////*/
    function getRewardToken() external view returns (address) {
        return AppStorage.layout().token;
    }

    function getRecycleRate(AppStorage.Material material) external view returns (uint256) {
        return AppStorage.layout().recycleRates[material];
    }

    function getNudos(address user) external view returns (uint256) {
        address token = AppStorage.layout().token;
        if (token == address(0)) {
            return 0;
        }

        return IERC20Minimal(token).balanceOf(user);
    }

    function getNudosAccumulated(address user) external view returns (uint256) {
        return AppStorage.layout().nudosAccumulated[user];
    }

    function getRewardBaseUnit() external view returns (uint256) {
        return AppStorage.layout().rewardBaseUnit;
    }

    function getRewardTreasuryBalance() external view returns (uint256) {
        address token = AppStorage.layout().token;
        if (token == address(0)) {
            return 0;
        }

        return IERC20Minimal(token).balanceOf(address(this));
    }
}
