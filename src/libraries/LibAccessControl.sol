// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library LibAccessControl {
    bytes32 constant ACCESS_CONTROL_STORAGE_POSITION =
        keccak256("nudos.access.control.storage");

    struct RoleData {
        mapping(address => bool) members;
    }

    struct Storage {
        mapping(bytes32 => RoleData) roles;
    }

    // Roles globales
bytes32 constant CHAIRPERSON_ROLE      = keccak256("CHAIRPERSON_ROLE");
bytes32 constant BOARD_MEMBER_ROLE     = keccak256("BOARD_MEMBER_ROLE");
bytes32 constant ASSEMBLY_ADMIN_ROLE   = keccak256("ASSEMBLY_ADMIN_ROLE");
bytes32 constant RESPONSIBLE_ROLE      = keccak256("RESPONSIBLE_ROLE");
bytes32 constant PROPOSER_ROLE         = keccak256("PROPOSER_ROLE");
bytes32 constant MEMBER_ROLE           = keccak256("MEMBER_ROLE");

    function accessStorage() internal pure returns (Storage storage s) {
        bytes32 position = ACCESS_CONTROL_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    function grantRole(bytes32 role, address account) internal {
        Storage storage s = accessStorage();
        s.roles[role].members[account] = true;
    }

    function revokeRole(bytes32 role, address account) internal {
        Storage storage s = accessStorage();
        s.roles[role].members[account] = false;
    }

    function hasRole(bytes32 role, address account) internal view returns (bool) {
        Storage storage s = accessStorage();
        return s.roles[role].members[account];
    }
}
