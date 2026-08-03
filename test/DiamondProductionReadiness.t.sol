// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {Diamond} from "src/diamond/Diamond.sol";
import {NudosFacetCutFactory} from "src/diamond/NudosFacetCutFactory.sol";
import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {IDiamondLoupe} from "src/interfaces/diamond/IDiamondLoupe.sol";
import {DiamondCutFacet} from "src/facets/core/DiamondCutFacet.sol";
import {OwnershipFacet} from "src/facets/core/OwnershipFacet.sol";
import {TicketsFacet} from "src/facets/economy/TicketsFacet.sol";
import {UniversityFacet} from "src/facets/recycling/UniversityFacet.sol";
import {DiamondInit} from "src/init/DiamondInit.sol";

contract DummyUpgradeFacet {
    function ping() external pure returns (uint256) {
        return 1;
    }
}

contract SecondDummyUpgradeFacet {
    function pong() external pure returns (uint256) {
        return 2;
    }
}

contract DiamondProductionReadinessTest is Test {
    address internal protocolOwner;
    address internal attacker;
    Diamond internal diamond;

    function setUp() public {
        protocolOwner = makeAddr("protocol-safe");
        attacker = makeAddr("attacker");

        DiamondCutFacet cutFacet = new DiamondCutFacet();
        diamond = new Diamond(protocolOwner, address(cutFacet));
        DiamondInit init = new DiamondInit();
        NudosFacetCutFactory factory = new NudosFacetCutFactory();
        IDiamondCut.FacetCut[] memory cut = factory.deployFacets();

        vm.prank(protocolOwner);
        IDiamondCut(address(diamond)).diamondCut(cut, address(init), abi.encodeCall(DiamondInit.init, ()));
    }

    function testFullCutInstallsCanonicalFacetsAndSelectors() public view {
        IDiamondLoupe loupe = IDiamondLoupe(address(diamond));
        address[] memory facetAddresses = loupe.facetAddresses();

        // DiamondCutFacet from the constructor plus the canonical 21-facet cut.
        assertEq(facetAddresses.length, 22);

        uint256 selectorCount;
        for (uint256 i; i < facetAddresses.length; i++) {
            bytes4[] memory selectors = loupe.facetFunctionSelectors(facetAddresses[i]);
            assertGt(selectors.length, 0);
            selectorCount += selectors.length;

            for (uint256 j; j < selectors.length; j++) {
                assertEq(loupe.facetAddress(selectors[j]), facetAddresses[i]);
            }
        }

        assertEq(selectorCount, 149);
    }

    function testInitializationKeepsConstructorOwnerAndDefaults() public view {
        assertEq(OwnershipFacet(address(diamond)).owner(), protocolOwner);
        assertTrue(UniversityFacet(address(diamond)).isSystemAdmin(protocolOwner));
        assertEq(TicketsFacet(address(diamond)).quoteTicketRedemption(1), 10 ether);
        assertEq(TicketsFacet(address(diamond)).quoteTicketRedemption(3), 30 ether);
    }

    function testNonOwnerCannotUpgrade() public {
        IDiamondCut.FacetCut[] memory cut =
            _singleAdd(address(new DummyUpgradeFacet()), DummyUpgradeFacet.ping.selector);

        vm.prank(attacker);
        vm.expectRevert("LibDiamond: NOT_OWNER");
        IDiamondCut(address(diamond)).diamondCut(cut, address(0), "");
    }

    function testOwnershipTransferMovesBusinessAndUpgradeAuthority() public {
        address newOwner = makeAddr("new-protocol-safe");

        vm.prank(protocolOwner);
        OwnershipFacet(address(diamond)).transferOwnership(newOwner);

        assertEq(OwnershipFacet(address(diamond)).owner(), newOwner);

        IDiamondCut.FacetCut[] memory oldOwnerCut =
            _singleAdd(address(new DummyUpgradeFacet()), DummyUpgradeFacet.ping.selector);
        vm.prank(protocolOwner);
        vm.expectRevert("LibDiamond: NOT_OWNER");
        IDiamondCut(address(diamond)).diamondCut(oldOwnerCut, address(0), "");

        IDiamondCut.FacetCut[] memory newOwnerCut =
            _singleAdd(address(new SecondDummyUpgradeFacet()), SecondDummyUpgradeFacet.pong.selector);
        vm.prank(newOwner);
        IDiamondCut(address(diamond)).diamondCut(newOwnerCut, address(0), "");

        assertEq(SecondDummyUpgradeFacet(address(diamond)).pong(), 2);
    }

    function testFuzzOwnershipTransferKeepsAuthoritiesInSync(address newOwner) public {
        vm.assume(newOwner != address(0));
        vm.assume(newOwner != protocolOwner);

        vm.prank(protocolOwner);
        OwnershipFacet(address(diamond)).transferOwnership(newOwner);

        assertEq(OwnershipFacet(address(diamond)).owner(), newOwner);

        vm.prank(newOwner);
        UniversityFacet(address(diamond)).setSystemAdmin(attacker, true);
        assertTrue(UniversityFacet(address(diamond)).isSystemAdmin(attacker));
    }

    function testOwnershipCannotTransferToZeroAddress() public {
        vm.prank(protocolOwner);
        vm.expectRevert("Zero owner");
        OwnershipFacet(address(diamond)).transferOwnership(address(0));
    }

    function _singleAdd(address facet, bytes4 selector) internal pure returns (IDiamondCut.FacetCut[] memory cut) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = selector;

        cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: facet, action: IDiamondCut.FacetCutAction.Add, functionSelectors: selectors
        });
    }
}
