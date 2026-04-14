// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

library AppStorage {
    // =============================================================
    // STORAGE SLOT (ÚNICO)
    // =============================================================
    bytes32 internal constant STORAGE_SLOT = keccak256("nudos.app.storage.v1");

    // =============================================================
    // ENUMS
    // =============================================================
    enum Role {
	None,
	Student,
	Professor,
	AdministrativeStaff,
	CampusStaff,
	UniversityStaff
    }

    enum ItemStatus {
        Unlisted,
        Listed,
        Sold
    }

    enum Material {
        AL,
        PL,
        CB,
        GL,
        OT
    }

    // =============================================================
    // STRUCTS AUXILIARES
    // =============================================================

    // ---- University ----
    struct University {
	uint256 id;
	string name;
	string metadataURI;

	address[] staffList;
	mapping(address => bool) isStaff;

	uint256[] campusIds;
	}

    // ---- Campus ----
    struct Campus {
	uint256 id;

	uint256 universityId;

	string name;
	string metadataURI;

	address[] staffList;
	mapping(address => bool) isStaff;

	uint256[] programIds;
	}

    // ---- Program ----
    struct Program {
	uint256 id;

	uint256 campusId;

	string name;
	string metadataURI;

	address coordinator;
	}

    // ---- Profiles ----
    struct Profile {
	address owner;

	uint256 universityId;
	uint256 campusId;
	uint256 programId;

	string metadataURI;

	Role role;

	bool exists;
	}

    // ---- Marketplace ----
    struct Item {
        uint256 id;
        address owner;
        uint8 itemType;
        string metadataURI;
        uint256 price;
        ItemStatus status;
    }

    struct Trade {
        uint256 id;
        address proposer;
        uint256 itemA;
        uint256 itemB;
        bool accepted;
    }

    // ---- DAO ----
    struct Assembly {
        uint256 id;
        uint256 campusId;
        string title;
        string metadata;
        bool open;
    }

    struct Proposal {
        uint256 id;
        uint256 assemblyId;
        address proposer;
        string title;
        string metadata;
        uint256 votesFor;
        uint256 votesAgainst;
        bool open;
        bool executed;
    }

    // ---- Participation ----
    struct ParticipationData {
        bool submitted;
        bool validated;
        string evidence;
    }

    // ---- Recycling ----
    struct MaterialRecord {
        uint256 aluminium;
        uint256 plastic;
        uint256 cardboard;
        uint256 glass;
        uint256 timestamp;
	uint256 rewardBaseUnit;
	uint256 rewardDecayFactor;
    }

    struct CampusMaterialRecord {
        address user;
        MaterialRecord record;
    }

    // ---- Recycling Machines ----
    struct Machine {
	uint256 id;
	uint256 campusId;
	string metadataURI;
	address operator;
	bool active;
}
	
// =============================================================
// 🌱 IMPACT CREDENTIALS
// =============================================================

struct ImpactCredential {
    address user;
    uint256 year;
    uint256 aluminium;
    uint256 plastic;
    uint256 cardboard;
    uint256 glass;
    uint256 co2Saved;
}

// =============================================================
// 🌍 IMPACT AGGREGATION
// =============================================================

struct UserImpactTotals {
    uint256 aluminium;
    uint256 plastic;
    uint256 cardboard;
    uint256 glass;
    uint256 totalActions;
}

// =============================================================
// 🔐 ORACLE REPUTATION
// =============================================================

struct OracleStats {
    uint256 submissions;
    uint256 rejected;
    uint256 lastSubmission;
}

    // =============================================================
    // LAYOUT PRINCIPAL (ÚNICO)
    // =============================================================
    struct Layout {
        // ---- Ownership ----
        address owner;
	address governanceExecutor;

	// ---- Universities ----
	mapping(uint256 => University) universities;
	uint256[] universityIds;

	// ---- University Impact ----
	mapping(uint256 => UserImpactTotals) universityImpactTotals;

	// ---- Campuses ----
	mapping(uint256 => Campus) campuses;
	uint256[] campusIds;

	// ---- Programs ----
	mapping(uint256 => Program) programs;
	uint256[] programIds;

	// ---- Program Impact ----
	mapping(uint256 => UserImpactTotals) programImpactTotals;

        // ---- Profiles ----
        mapping(address => Profile) profiles;
        address[] profileOwners;

        // ---- University Staff ----
        mapping(address => bool) isUniversityStaff;

        // ---- Tickets ----
        mapping(address => uint256) ticketBalance;
        address tokenContract;
        uint256 ticketPriceInTokens;

        // ---- Rewards ----
        address token;
        mapping(Material => uint256) recycleRates;
	uint256 rewardBaseUnit;

        // ---- NUDOS Economy ----
        mapping(address => uint256) nudosBalance; // tokens disponibles
        mapping(address => uint256) nudosAccumulated; // histórico total
        uint256 nudosPerTicket; // = 10

        // ---- Marketplace ----
        uint256 nextItemId;
        uint256 nextTradeId;
        uint256 marketplaceFeeBps;
	mapping(address => uint256) lastPurchaseBlock;
        mapping(uint256 => Item) items;
        mapping(uint256 => Trade) trades;
        mapping(uint256 => mapping(address => uint8)) ratings;

        // ---- DAO ----
        uint256 nextAssemblyId;
        uint256 nextProposalId;
        mapping(uint256 => Assembly) assemblies;
        mapping(uint256 => Proposal) proposals;

        // ---- Participation ----
        mapping(bytes32 => mapping(address => ParticipationData)) participation;

        // ---- Recycling History ----
        mapping(address => CampusMaterialRecord[]) recyclingHistory;

	// ---- Recycling Oracle ----
	mapping(address => bool) recyclingOracles;
	mapping(bytes32 => bool) processedRecycles;
	mapping(address => uint256) oracleMachine;
	mapping(uint256 => uint256) lastMachineRecycle;
	mapping(address => uint256) oracleReputation;
	mapping(address => bool) oracleBlocked;
	mapping(address => uint256) oracleDailyImpact;
	mapping(address => uint256) oracleLastReset;

	// ---- Recycling Machines ----
	uint256 nextMachineId;
	mapping(uint256 => Machine) machines;
	uint256[] machineIds;

	// ---- Impact Credentials ----
	uint256 nextImpactCredentialId;
	mapping(uint256 => ImpactCredential) impactCredentials;
	mapping(address => uint256[]) userImpactCredentials;
	mapping(address => mapping(uint256 => bool)) userYearCredentialMinted;

	// ---- Impact Aggregation ----
	mapping(address => UserImpactTotals) userImpactTotals;
	mapping(uint256 => UserImpactTotals) campusImpactTotals;
	mapping(address => uint256) userBadgeLevel;
	UserImpactTotals globalImpact;

	// ---- Oracle Reputation ----
	mapping(address => OracleStats) oracleStats;

	// ---- Recycler Index ----
	address[] recyclerIndex;
	mapping(address => bool) recyclerExists;

	// ---- Anti Fraud ----
	mapping(address => uint256) lastUserRecycle;

}

    // =============================================================
    // ACCESSOR
    // =============================================================
    function layout() internal pure returns (Layout storage s) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            s.slot := slot
        }
    }

}
