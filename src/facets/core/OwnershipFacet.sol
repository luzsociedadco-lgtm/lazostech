// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {LibDiamond} from "src/libraries/LibDiamond.sol";

contract OwnershipFacet {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/

    function owner() external view returns (address) {
        return LibDiamond.contractOwner();
    }

    /*//////////////////////////////////////////////////////////////
                                CORE
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero owner");

        AppStorage.Layout storage s = AppStorage.layout();

        address previousOwner = LibDiamond.contractOwner();
        s.owner = newOwner;
        LibDiamond.setContractOwner(newOwner);

        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
