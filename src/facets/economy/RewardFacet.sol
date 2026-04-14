// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

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

    /*//////////////////////////////////////////////////////////////
                                ADMIN
    //////////////////////////////////////////////////////////////*/
    function setRewardToken(address token) external onlyOwner {
        require(token != address(0), "RewardFacet: ZERO_ADDRESS");
        AppStorage.layout().token = token;
        emit TokenUpdated(token);
    }

function setRecycleRate(AppStorage.Material material, uint256 rate)
    external
    onlyOwner
{
    require(rate > 0, "RewardFacet: ZERO_RATE");

    AppStorage.layout().recycleRates[material] = rate;

    emit RecycleRateUpdated(bytes32(uint256(material)), rate);
}

    /*//////////////////////////////////////////////////////////////
                                REWARDS
    //////////////////////////////////////////////////////////////*/
function grantReward(address user, uint256 amount) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(
        msg.sender == address(this) || s.recyclingOracles[msg.sender],
        "RewardFacet: NOT_AUTHORIZED"
    );

    require(user != address(0), "RewardFacet: ZERO_USER");
    require(amount > 0, "RewardFacet: ZERO_AMOUNT");

    uint256 maxReward = 100 ether;
    require(amount <= maxReward, "RewardFacet: MAX_REWARD_EXCEEDED");

    s.nudosAccumulated[user] += amount;
    s.nudosBalance[user] += amount;

    uint256 newBalance = s.nudosBalance[user];

    emit RewardGranted(user, amount, newBalance);
}

    /*//////////////////////////////////////////////////////////////
                                VIEWS
    //////////////////////////////////////////////////////////////*/
    function getRewardToken() external view returns (address) {
        return AppStorage.layout().token;
    }

function getRecycleRate(AppStorage.Material material)
    external
    view
    returns (uint256)
{
    return AppStorage.layout().recycleRates[material];
}

function getNudos(address user) external view returns (uint256) {
    return AppStorage.layout().nudosBalance[user];
}

    function getNudosAccumulated(address user) external view returns (uint256) {
        return AppStorage.layout().nudosAccumulated[user];
    }
}
