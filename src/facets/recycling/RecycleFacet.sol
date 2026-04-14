// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {IReward} from "src/interfaces/IReward.sol";
import {IProofOfRecycling} from "src/interfaces/IProofOfRecycling.sol";

contract RecycleFacet is IProofOfRecycling {

event RewardTriggered(address indexed user, uint256 amount);
event RecyclingBadgeMinted(address indexed user, uint256 level);

function recordRecycleFromOracle(
    uint256 machineId,
    address user,
    uint256 aluminium,
    uint256 plastic,
    uint256 cardboard,
    uint256 glass
) external {

    AppStorage.Layout storage s = AppStorage.layout();

    require(s.recyclingOracles[msg.sender], "Not oracle");

require(
    s.profiles[user].exists,
    "User has no profile"
);

require(
    s.oracleMachine[msg.sender] == machineId,
    "Oracle not linked to machine"
);

require(
    s.machines[machineId].id != 0,
    "Machine not found"
);

require(
    s.machines[machineId].active,
    "Machine inactive"
);

require(
    block.timestamp >
    s.lastMachineRecycle[machineId] + 10 seconds,
    "Machine cooldown"
);

s.lastMachineRecycle[machineId] = block.timestamp;

// --------------------------------------------------
// USER COOLDOWN
// --------------------------------------------------

require(
    block.timestamp >
    s.lastUserRecycle[user] + 10 seconds,
    "User recycle cooldown"
);

s.lastUserRecycle[user] = block.timestamp;

bytes32 hash = keccak256(
    abi.encode(
        user,
        machineId,
        aluminium,
        plastic,
        cardboard,
        glass,
        block.timestamp
    )
);

require(!s.processedRecycles[hash], "Duplicate recycle");
s.processedRecycles[hash] = true;

uint256 total =
    aluminium + plastic + cardboard + glass;

require(total > 0, "Empty recycle");
require(total <= 100, "Too many materials");

require(aluminium <= 25, "Too many aluminium");
require(plastic <= 25, "Too many plastic");
require(cardboard <= 25, "Too many cardboard");
require(glass <= 25, "Too many glass");

	require(!s.oracleBlocked[msg.sender], "Oracle blocked");
	s.oracleReputation[msg.sender] += 1;

    if (total > 80 && s.oracleReputation[msg.sender] > 0) {
    s.oracleReputation[msg.sender] -= 1;
}

    AppStorage.MaterialRecord memory record =
        AppStorage.MaterialRecord({
            aluminium: aluminium,
            plastic: plastic,
            cardboard: cardboard,
            glass: glass,
            timestamp: block.timestamp,
	    rewardBaseUnit: s.rewardBaseUnit,
	    rewardDecayFactor: 0
        });

    s.recyclingHistory[user].push(
        AppStorage.CampusMaterialRecord({
            user: user,
            record: record
        })
    );

AppStorage.UserImpactTotals storage totals =
    s.userImpactTotals[user];

totals.aluminium += aluminium;
totals.plastic += plastic;
totals.cardboard += cardboard;
totals.glass += glass;

totals.totalActions += 1;

// --------------------------------------------------
// INDEX NEW RECYCLERS
// --------------------------------------------------

if (!s.recyclerExists[user]) {
    s.recyclerExists[user] = true;
    s.recyclerIndex.push(user);
}

     AppStorage.OracleStats storage stats =
	s.oracleStats[msg.sender];

	// reset diario simple
	if (block.timestamp > stats.lastSubmission + 1 days) {
	    stats.submissions = 0;
	}

	// límite duro
	require(stats.submissions < 1000, "Oracle daily limit");

	// anti-spam
	require(
	    block.timestamp >= stats.lastSubmission + 2 seconds,
	    "Oracle spam");

	stats.submissions += 1;
	stats.lastSubmission = block.timestamp;

// --------------------------------------------------
// CAMPUS IMPACT AGGREGATION
// --------------------------------------------------

uint256 programId = s.profiles[user].programId;
uint256 campusId = s.machines[machineId].campusId;
uint256 universityId = s.campuses[campusId].universityId;

AppStorage.UserImpactTotals storage programTotals =
    s.programImpactTotals[programId];
programTotals.aluminium += aluminium;
programTotals.plastic += plastic;
programTotals.cardboard += cardboard;
programTotals.glass += glass;
programTotals.totalActions += 1;

AppStorage.UserImpactTotals storage campusTotals =
    s.campusImpactTotals[campusId];
campusTotals.aluminium += aluminium;
campusTotals.plastic += plastic;
campusTotals.cardboard += cardboard;
campusTotals.glass += glass;
campusTotals.totalActions += 1;

// UNIVERSITY
AppStorage.UserImpactTotals storage universityTotals =
    s.universityImpactTotals[universityId];

universityTotals.aluminium += aluminium;
universityTotals.plastic += plastic;
universityTotals.cardboard += cardboard;
universityTotals.glass += glass;
universityTotals.totalActions += 1;

// GLOBAL
AppStorage.UserImpactTotals storage global =
    s.globalImpact;

global.aluminium += aluminium;
global.plastic += plastic;
global.cardboard += cardboard;
global.glass += glass;
global.totalActions += 1;

    // --------------------------------------------------
    // CALCULAR REWARD
    // --------------------------------------------------

uint256 rawImpact =
    aluminium * s.recycleRates[AppStorage.Material.AL] +
    plastic * s.recycleRates[AppStorage.Material.PL] +
    cardboard * s.recycleRates[AppStorage.Material.CB] +
    glass * s.recycleRates[AppStorage.Material.GL];

// 🔽 NUEVO: ajuste dinámico simple
uint256 reward = rawImpact * s.rewardBaseUnit;

// 🔽 control básico anti-inflación (soft cap)
uint256 maxRewardPerAction = 10 ether;
if (reward > maxRewardPerAction) {
    reward = maxRewardPerAction;
}

    if (reward > 0) {

	_grantReward(user, reward);

	emit RewardTriggered(user, reward);

    }

if (block.timestamp > s.oracleLastReset[msg.sender] + 1 days) {
    s.oracleDailyImpact[msg.sender] = 0;
    s.oracleLastReset[msg.sender] = block.timestamp;
}

s.oracleDailyImpact[msg.sender] += total;

require(
    s.oracleDailyImpact[msg.sender] <= 5000,
    "Oracle impact limit exceeded"
);


	// BADGE AUTO

uint256 actions = s.userImpactTotals[user].totalActions;
uint256 level = actions / 100;

if (level > s.userBadgeLevel[user]) {
    s.userBadgeLevel[user] = level;
    emit RecyclingBadgeMinted(user, level);
}

// --------------------------------------------------
// BADGE CHECK
// --------------------------------------------------

// BADGE DISABLED TEMPORARILY

}

function setRecyclingOracle(address oracle, bool status) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == s.owner, "Not owner");
    require(oracle != address(0), "Zero oracle");

    if (!status) {
        // unlink clean
        s.oracleMachine[oracle] = 0;
    }

    s.recyclingOracles[oracle] = status;
}



function recordRecycleBatch(
    uint256 machineId,
    address[] calldata users,
    uint256[] calldata aluminium,
    uint256[] calldata plastic,
    uint256[] calldata cardboard,
    uint256[] calldata glass
	) external {

    AppStorage.Layout storage s = AppStorage.layout();

    require(s.recyclingOracles[msg.sender], "Not oracle");

    require(
        s.oracleMachine[msg.sender] == machineId,
        "Oracle not linked to machine"
    );

    require(
        s.machines[machineId].id != 0,
        "Machine not found"
    );

    require(
        s.machines[machineId].active,
        "Machine inactive"
    );

    require(
        users.length == aluminium.length &&
        users.length == plastic.length &&
        users.length == cardboard.length &&
        users.length == glass.length,
        "Length mismatch"
    );

require(users.length <= 10, "Batch too large");
require(!s.oracleBlocked[msg.sender], "Oracle blocked");

    // MACHINE COOLDOWN (igual que oracle)
    require(
        block.timestamp >
        s.lastMachineRecycle[machineId] + 10 seconds,
        "Machine cooldown"
    );

    s.lastMachineRecycle[machineId] = block.timestamp;

    uint256 campusId = s.machines[machineId].campusId;
    uint256 universityId = s.campuses[campusId].universityId;

AppStorage.OracleStats storage stats =
    s.oracleStats[msg.sender];

if (block.timestamp > s.oracleLastReset[msg.sender] + 1 days) {
    s.oracleDailyImpact[msg.sender] = 0;
    s.oracleLastReset[msg.sender] = block.timestamp;
}

if (block.timestamp > stats.lastSubmission + 1 days) {
    stats.submissions = 0;
}

require(
    stats.submissions + users.length <= 1000,
    "Oracle daily limit"
);

    for (uint256 i = 0; i < users.length; i++) {

        address user = users[i];

bytes32 hash = keccak256(
    abi.encode(
        user,
        machineId,
        aluminium[i],
        plastic[i],
        cardboard[i],
        glass[i],
        block.timestamp,
        i
    )
);

require(!s.processedRecycles[hash], "Duplicate recycle");
s.processedRecycles[hash] = true;

        require(
            s.profiles[user].exists,
            "User has no profile"
        );

        // USER COOLDOWN
        require(
            block.timestamp >
            s.lastUserRecycle[user] + 10 seconds,
            "User cooldown"
        );

        s.lastUserRecycle[user] = block.timestamp;

        uint256 al = aluminium[i];
        uint256 pl = plastic[i];
        uint256 cb = cardboard[i];
        uint256 gl = glass[i];

        require(al <= 25, "Too many aluminium");
        require(pl <= 25, "Too many plastic");
        require(cb <= 25, "Too many cardboard");
        require(gl <= 25, "Too many glass");

uint256 total = al + pl + cb + gl;
require(total <= 100, "Too many materials");

        if (al + pl + cb + gl == 0) continue;

uint256 newImpact = s.oracleDailyImpact[msg.sender] + (al + pl + cb + gl);

require(newImpact <= 5000, "Oracle impact limit exceeded");

s.oracleDailyImpact[msg.sender] = newImpact;

        // ------------------------------------
        // HISTORY
        // ------------------------------------

        AppStorage.MaterialRecord memory record =
            AppStorage.MaterialRecord({
                aluminium: al,
                plastic: pl,
                cardboard: cb,
                glass: gl,
                timestamp: block.timestamp,
	        rewardBaseUnit: s.rewardBaseUnit,
		rewardDecayFactor: 0
           });

        s.recyclingHistory[user].push(
            AppStorage.CampusMaterialRecord({
                user: user,
                record: record
            })
        );

        // ------------------------------------
        // USER TOTALS
        // ------------------------------------

        AppStorage.UserImpactTotals storage totals =
            s.userImpactTotals[user];

        totals.aluminium += al;
        totals.plastic += pl;
        totals.cardboard += cb;
        totals.glass += gl;
        totals.totalActions += 1;

        // INDEX
        if (!s.recyclerExists[user]) {
            s.recyclerExists[user] = true;
            s.recyclerIndex.push(user);
        }

        // ------------------------------------
        // PROGRAM
        // ------------------------------------

        uint256 programId = s.profiles[user].programId;

        AppStorage.UserImpactTotals storage programTotals =
            s.programImpactTotals[programId];

        programTotals.aluminium += al;
        programTotals.plastic += pl;
        programTotals.cardboard += cb;
        programTotals.glass += gl;
        programTotals.totalActions += 1;

        // ------------------------------------
        // CAMPUS
        // ------------------------------------

        AppStorage.UserImpactTotals storage campusTotals =
            s.campusImpactTotals[campusId];

        campusTotals.aluminium += al;
        campusTotals.plastic += pl;
        campusTotals.cardboard += cb;
        campusTotals.glass += gl;
        campusTotals.totalActions += 1;

        // ------------------------------------
        // UNIVERSITY
        // ------------------------------------

        AppStorage.UserImpactTotals storage universityTotals =
            s.universityImpactTotals[universityId];

        universityTotals.aluminium += al;
        universityTotals.plastic += pl;
        universityTotals.cardboard += cb;
        universityTotals.glass += gl;
        universityTotals.totalActions += 1;

        // ------------------------------------
        // GLOBAL
        // ------------------------------------

        AppStorage.UserImpactTotals storage global =
            s.globalImpact;

        global.aluminium += al;
        global.plastic += pl;
        global.cardboard += cb;
        global.glass += gl;
        global.totalActions += 1;

        // ------------------------------------
        // REWARD
        // ------------------------------------

uint256 rawImpact =
    al * s.recycleRates[AppStorage.Material.AL] +
    pl * s.recycleRates[AppStorage.Material.PL] +
    cb * s.recycleRates[AppStorage.Material.CB] +
    gl * s.recycleRates[AppStorage.Material.GL];

//   NUEVO: ajuste dinámico simple
uint256 reward = rawImpact * s.rewardBaseUnit;

//   control básico anti-inflación (soft cap)
uint256 maxRewardPerAction = 10 ether;

if (reward > maxRewardPerAction) {
    reward = maxRewardPerAction;
}

if (reward > 0) {
    _grantReward(user, reward);
    emit RewardTriggered(user, reward);
}

	// BADGE AUTO

uint256 actions = s.userImpactTotals[user].totalActions;
uint256 level = actions / 100;

if (level > s.userBadgeLevel[user]) {
    s.userBadgeLevel[user] = level;
    emit RecyclingBadgeMinted(user, level);
	}
}

    // ------------------------------------
    // ORACLE STATS (una sola vez)
    // ------------------------------------

    stats.submissions += users.length;
    stats.lastSubmission = block.timestamp;
}


function getUserRecycleImpact(address user)
    external
    view
    returns (
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass,
        uint256 actions
    )
{
    AppStorage.UserImpactTotals storage totals =
        AppStorage.layout().userImpactTotals[user];

    return (
        totals.aluminium,
        totals.plastic,
        totals.cardboard,
        totals.glass,
        totals.totalActions
    );
}

    function getRecycleHistory(address user) external view returns (AppStorage.CampusMaterialRecord[] memory) {
        return AppStorage.layout().recyclingHistory[user];
    }

function _grantReward(address user, uint256 amount) internal {
    IReward(address(this)).grantReward(user, amount);
}

function apiUserImpact(address user)
    external
    view
    returns (AppStorage.UserImpactTotals memory)
{
    return AppStorage.layout().userImpactTotals[user];
	}

function apiProgramImpact(uint256 programId)
    external
    view
    returns (AppStorage.UserImpactTotals memory)
{
    return AppStorage.layout().programImpactTotals[programId];
	}

function apiCampusImpact(uint256 campusId)
    external
    view
    returns (AppStorage.UserImpactTotals memory)
{
    return AppStorage.layout().campusImpactTotals[campusId];
	}

function apiUniversityImpact(uint256 universityId)
    external
    view
    returns (AppStorage.UserImpactTotals memory)
{
    return AppStorage.layout().universityImpactTotals[universityId];
	}

function apiGlobalImpact()
    external
    view
    returns (AppStorage.UserImpactTotals memory)
{
    return AppStorage.layout().globalImpact;
}

}
