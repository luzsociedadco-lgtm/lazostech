// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract OwnershipFacet {

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/

    function owner() external view returns (address) {
        return AppStorage.layout().owner;
    }

    /*//////////////////////////////////////////////////////////////
                                CORE
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        require(msg.sender == AppStorage.layout().owner, "Not owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero owner");

        AppStorage.Layout storage s = AppStorage.layout();

        address previousOwner = s.owner;
        s.owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
