==================== src/facets/core/DiamondCutFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IDiamondCut} from "src/interfaces/diamond/IDiamondCut.sol";
import {LibDiamond} from "src/libraries/LibDiamond.sol";

/// @notice DiamondCutFacet - Delegates to LibDiamond for updates
contract DiamondCutFacet is IDiamondCut {
    function diamondCut(FacetCut[] calldata _cut, address _init, bytes calldata _calldata) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.diamondCut(_cut, _init, _calldata);
    }
}

==================== src/facets/core/DiamondLoupeFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IDiamondLoupe} from "src/interfaces/diamond/IDiamondLoupe.sol";
import {LibDiamond} from "src/libraries/LibDiamond.sol";

contract DiamondLoupeFacet is IDiamondLoupe {
    function facets() external view override returns (Facet[] memory facets_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 numFacets = ds.facetAddresses.length;

        facets_ = new Facet[](numFacets);

        for (uint256 i; i < numFacets; i++) {
            address facetAddr = ds.facetAddresses[i];
            facets_[i].facetAddress = facetAddr;
            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddr].functionSelectors;
        }
    }

    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory) {
        return LibDiamond.diamondStorage().facetFunctionSelectors[_facet].functionSelectors;
    }

    function facetAddresses() external view override returns (address[] memory) {
        return LibDiamond.diamondStorage().facetAddresses;
    }

    function facetAddress(bytes4 _selector) external view override returns (address) {
        return LibDiamond.diamondStorage().selectorToFacetAndPosition[_selector].facetAddress;
    }
}

==================== src/facets/core/OwnershipFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {LibDiamond} from "src/libraries/LibDiamond.sol";

contract OwnershipFacet {
    function owner() external view returns (address) {
        return LibDiamond.contractOwner();
    }

    function transferOwnership(address newOwner) external {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setContractOwner(newOwner);
    }
}

==================== src/facets/economy/ParticipationFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ParticipationFacet {
    event SubmissionRegistered(bytes32 indexed proposalId, address indexed actor, string evidence);
    event CompletionValidated(bytes32 indexed proposalId, address indexed actor);

function registerSubmission(bytes32 proposalId, address actor, string calldata evidence) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.recyclingOracles[msg.sender], "NOT_ORACLE");
    require(!s.participation[proposalId][actor].submitted, "Already submitted");

    s.participation[proposalId][actor].submitted = true;
    s.participation[proposalId][actor].evidence = evidence;

    emit SubmissionRegistered(proposalId, actor, evidence);
}

function validateCompletion(bytes32 proposalId, address actor) external returns (bool) {
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.recyclingOracles[msg.sender], "NOT_ORACLE");
    require(s.participation[proposalId][actor].submitted, "Not submitted");
    require(!s.participation[proposalId][actor].validated, "Already validated");

        s.participation[proposalId][actor].validated = true;
	s.userImpactTotals[actor].totalActions += 1;

        emit CompletionValidated(proposalId, actor);
        return true;
    }
}

==================== src/facets/economy/RewardFacet.sol ====================
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

function adminResetNudos(address user) external onlyOwner {
    AppStorage.Layout storage s = AppStorage.layout();

    s.nudosBalance[user] = 0;
	
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
    require(amount <= 100 ether, "RewardFacet: MAX_REWARD_EXCEEDED");

// ------------------------------------
// CONTABILIDAD INTERNA (SOURCE OF TRUTH)
// ------------------------------------

s.nudosAccumulated[user] += amount;
s.nudosBalance[user] += amount;

// ------------------------------------
// NO ERC20 TRANSFER (CLOSED ECONOMY)
// ------------------------------------

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

==================== src/facets/economy/TicketsFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {ITicketsModule} from "src/interfaces/modules/ITicketsModule.sol";

contract TicketsFacet is ITicketsModule {
    event TicketsMinted(address indexed to, uint256 amount, uint256 indexed ticketType, address operator);
    event TicketsTransferred(address indexed from, address indexed to, uint256 amount);
    event TicketsUsed(address indexed user, uint256 amount);
    event TicketsRedeemed(address indexed user, uint256 tickets, uint256 nudosSpent);
    event TicketsPurchasedFiat(address indexed user, uint256 amount, address operator);

    // ----------------------------
    // REDEEM NUDOS FOR TICKET
    // ----------------------------
    function redeemTickets(uint256 ticketsAmount) external {
        AppStorage.Layout storage s = AppStorage.layout();
        uint256 requiredNudos = ticketsAmount * s.nudosPerTicket;
        require(s.nudosBalance[msg.sender] >= requiredNudos, "Insufficient NUDOS");
	require(ticketsAmount > 0, "Invalid amount");

        // Descontar NUDOS
        s.nudosBalance[msg.sender] -= requiredNudos;
	s.nudosBalance[address(this)] += requiredNudos;

        // Agregar tickets
        s.ticketBalance[msg.sender] += ticketsAmount;

        emit TicketsRedeemed(msg.sender, ticketsAmount, requiredNudos);
    }

    // ----------------------------
    // MINT TICKET (cumple con ITicketsModule)
    // ----------------------------
    function mintTicket(address to, uint256, uint256 amount) external override {
        AppStorage.Layout storage s = AppStorage.layout();
        require(s.isUniversityStaff[msg.sender], "Only university staff");
        require(amount > 0, "Invalid amount");

        s.ticketBalance[to] += amount;
        emit TicketsMinted(to, amount, 0, msg.sender);
    }

    // ----------------------------
    // TRANSFER TICKET (cumple con ITicketsModule)
    // ----------------------------
function transferTicket(address from, address to, uint256 amount) external override {
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == from, "Not owner");
    require(to != address(0), "Invalid recipient");
    require(amount > 0, "Invalid amount");
    require(s.ticketBalance[from] >= amount, "Insufficient tickets");

    s.ticketBalance[from] -= amount;
    s.ticketBalance[to] += amount;

    emit TicketsTransferred(from, to, amount);
}

    // ----------------------------
    // USE TICKET (cumple con ITicketsModule)
    // ----------------------------

function useTicket(address user, uint256, uint256 amount) external override {
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.isUniversityStaff[msg.sender], "Only cafeteria");
    require(user != address(0), "Invalid user");
    require(amount > 0, "Invalid amount");

    require(s.ticketBalance[user] >= amount, "Insufficient tickets");

    s.ticketBalance[user] -= amount;

    emit TicketsUsed(user, amount);
}

    // ----------------------------
    // VIEW FUNCTION
    // ----------------------------
    function getTickets(address user) external view returns (uint256) {
        return AppStorage.layout().ticketBalance[user];
    }

function grantTicketsFromFiat(address user, uint256 amount) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.isUniversityStaff[msg.sender], "Only university");

    require(user != address(0), "Invalid user");
    require(amount > 0, "Invalid amount");

    s.ticketBalance[user] += amount;

    emit TicketsPurchasedFiat(user, amount, msg.sender);
}

}

==================== src/facets/economy/TreasuryFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AppStorage} from "src/libraries/AppStorage.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TreasuryFacet {

    address internal constant NUDOS =
        0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C;

    // --- Modificadores ---
    modifier onlyDiamond() {
        _onlyDiamond();
        _;
    }

    modifier onlyGovernance() {
        _onlyGovernance();
        _;
    }

    // --- Funciones Internas (La lógica que faltaba) ---
    function _onlyDiamond() internal view {
        require(msg.sender == address(this), "Treasury: ONLY_DIAMOND");
    }

    function _onlyGovernance() internal view {
        AppStorage.Layout storage s = AppStorage.layout();
        require(msg.sender == s.governanceExecutor, "Treasury: NOT_GOVERNANCE");
    }

    // --- Funciones Externas ---
    function treasuryExecute(address to, uint256 amount)
        external
        onlyGovernance
    {
        require(IERC20(NUDOS).transfer(to, amount), "Transfer failed");
    }

    function treasuryBalance() external view returns (uint256) {
        return IERC20(NUDOS).balanceOf(address(this));
    }
}

==================== src/facets/governance/corporate-governance/CancelResolutionFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { LibAccessControl } from "../../../libraries/LibAccessControl.sol";
import { CorporateGovernanceStorage } from "./storage/CorporateGovernanceStorage.sol";

contract CancelResolutionFacet {

    event ResolutionCancelled(uint256 resolutionId);

function cancelResolution(uint256 resolutionId) external {
    require(
        LibAccessControl.hasRole(LibAccessControl.ASSEMBLY_ADMIN_ROLE, msg.sender),
        "Not assembly admin"
    );

    CorporateGovernanceStorage.Layout storage l =
        CorporateGovernanceStorage.layout();

    CorporateGovernanceStorage.Resolution storage r =
        l.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Created,
        "Cannot cancel after voting starts"
    );

    r.status = CorporateGovernanceStorage.ResolutionStatus.Cancelled;
}

}

==================== src/facets/governance/corporate-governance/CorporateGovernanceFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CorporateGovernanceStorage} from "./storage/CorporateGovernanceStorage.sol";
import {LibDiamond} from "src/libraries/LibDiamond.sol";
import {AppStorage} from "src/libraries/AppStorage.sol";

contract CorporateGovernanceFacet {
function gs() internal pure returns (CorporateGovernanceStorage.Layout storage) {
    return CorporateGovernanceStorage.layout();
}

    // EVENTS
    event ChairpersonSet(address chairperson);
    event SecretarySet(address secretary);
    event BoardMemberAdded(address member);
    event SessionOpened(string name);
    event ResolutionCreated(uint256 id, string description);
    event Voted(address voter, uint256 resolutionId, bool support);
    event ResolutionClosed(uint256 id, bool approved, uint256 yesVotes, uint256 noVotes);
    event ResolutionVerified(uint256 id, address verifier);

    // MODIFIERS
modifier onlyChair() {
    _onlyChair();
    _;
}

function _onlyChair() internal view {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(msg.sender == ds.chairperson, "Not chairperson");
}

modifier onlyBoard() {
    _onlyBoard();
    _;
}

function _onlyBoard() internal view {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(ds.boardMembers[msg.sender], "Not board member");
}

modifier onlyVerifier() {
    _onlyVerifier();
    _;
}

function _onlyVerifier() internal view {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(
        msg.sender == ds.chairperson || msg.sender == ds.secretary,
        "Not verifier"
    );
}

    // 🔥 INIT (CRITICAL FOR DIAMOND STORAGE)
function initDao() external {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(!ds.initialized, "Already initialized");

    ds.initialized = true;
    ds.sessionActive = false;

    ds.nudosToken = 0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C;
    ds.quorumPercentage = 40;
}

    // GOVERNANCE SETUP
    function setChairperson(address _chair) external {
        CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
        ds.chairperson = _chair;
        emit ChairpersonSet(_chair);
    }

	function setSecretary(address _secretary) external onlyChair {
    CorporateGovernanceStorage.layout().secretary = _secretary;
    emit SecretarySet(_secretary);
}

function addBoardMember(address member) external onlyChair {
    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();

    require(!ds.boardMembers[member], "Already board member");

    ds.boardMembers[member] = true;
    ds.boardMemberCount++;

    emit BoardMemberAdded(member);
}

    // SESSION MANAGEMENT
    function openSession(string calldata name) external onlyChair {
        CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
        require(!ds.sessionActive, "Session already active");

        ds.sessionActive = true;
        emit SessionOpened(name);
    }

    // RESOLUTIONS
function createResolution(
    string calldata description,
    address responsible
) external onlyBoard {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(ds.sessionActive, "Session not active");

    uint256 id = ds.resolutionCount;

    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[id];

    r.description = description;
    r.responsible = responsible;

    // 🔹 Estado inicial: solo lectura
    r.status = CorporateGovernanceStorage.ResolutionStatus.Created;

    ds.resolutionCount++;

    emit ResolutionCreated(id, description);
}

function startDeliberation(uint256 resolutionId) external onlyChair {

    CorporateGovernanceStorage.Layout storage s =
        CorporateGovernanceStorage.layout();

    CorporateGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

    require(r.deliberationDeadline == 0, "Deliberation already started");

    r.deliberationDeadline = block.timestamp + 2 days;
}

    // VOTING
function startVoting(uint256 resolutionId) external onlyChair {

    CorporateGovernanceStorage.Layout storage s =
        CorporateGovernanceStorage.layout();

    CorporateGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

    require(
        block.timestamp >= r.deliberationDeadline,
        "Deliberation not finished"
    );

    r.status = CorporateGovernanceStorage.ResolutionStatus.Voting;

    r.votingDeadline = block.timestamp + 5 minutes;
}

function vote(uint256 resolutionId, bool support) external onlyBoard {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    require(ds.sessionActive, "Session not active");

    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Voting,
        "Not in voting state"
    );

    if (block.timestamp >= r.votingDeadline) {
        _closeResolution(resolutionId);
        return;
    }

    require(!r.voted[msg.sender], "Already voted");

    r.voted[msg.sender] = true;

    if (support) {
        r.yesVotes++;
    } else {
        r.noVotes++;
    }

    emit Voted(msg.sender, resolutionId, support);
}

function _closeResolution(uint256 resolutionId) internal {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Voting,
        "Not in voting state"
    );

    require(
        block.timestamp >= r.votingDeadline,
        "Voting still active"
    );

    uint256 totalVotes = r.yesVotes + r.noVotes;
    uint256 quorum = (ds.boardMemberCount * ds.quorumPercentage) / 100;

    if (totalVotes < quorum) {
        r.status = CorporateGovernanceStorage.ResolutionStatus.Rejected;
    } else if (r.yesVotes > r.noVotes) {
        r.status = CorporateGovernanceStorage.ResolutionStatus.Approved;
    } else {
        r.status = CorporateGovernanceStorage.ResolutionStatus.Rejected;
    }

    emit ResolutionClosed(
        resolutionId,
        r.status == CorporateGovernanceStorage.ResolutionStatus.Approved,
        r.yesVotes,
        r.noVotes
    );
}

function closeResolution(uint256 resolutionId) external {
    _closeResolution(resolutionId);
}

function executeResolution(uint256 resolutionId) external {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Approved,
        "Not approved"
    );

    require(msg.sender == r.responsible, "Not responsible");

    r.executed = true;
    r.status = CorporateGovernanceStorage.ResolutionStatus.Executed;
}

function verifyResolution(uint256 resolutionId) external onlyVerifier {

    CorporateGovernanceStorage.Layout storage ds = CorporateGovernanceStorage.layout();
    CorporateGovernanceStorage.Resolution storage r = ds.resolutions[resolutionId];

    require(
        r.status == CorporateGovernanceStorage.ResolutionStatus.Executed,
        "Not executed"
    );

    r.status = CorporateGovernanceStorage.ResolutionStatus.Verified;

    emit ResolutionVerified(resolutionId, msg.sender);
}

function setQuorumPercentage(uint256 newPercentage) external onlyChair {
    require(newPercentage > 0 && newPercentage <= 100, "Invalid percentage");
    CorporateGovernanceStorage.layout().quorumPercentage = newPercentage;
}

function setGovernanceExecutor(address executor) external {
    LibDiamond.enforceIsContractOwner();
    AppStorage.layout().governanceExecutor = executor;
}

}



==================== src/facets/governance/corporate-governance/CorporateGovernanceViewFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CorporateGovernanceStorage} from "./storage/CorporateGovernanceStorage.sol";

contract CorporateGovernanceViewFacet {

    function getResolutionCount() external view returns (uint256) {
        return CorporateGovernanceStorage.layout().resolutionCount;
    }

    function getResolution(uint256 id)
        external
        view
        returns (
            string memory description,
            uint256 yesVotes,
            uint256 noVotes,
            CorporateGovernanceStorage.ResolutionStatus
        )
    {
        CorporateGovernanceStorage.Resolution storage r =
            CorporateGovernanceStorage.layout().resolutions[id];

        return (r.description, r.yesVotes, r.noVotes, r.status);
    }
}

==================== src/facets/governance/corporate-governance/GovernanceRolesViewFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { LibAccessControl } from "../../../libraries/LibAccessControl.sol";

contract GovernanceRolesViewFacet {

    function isChairperson(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.CHAIRPERSON_ROLE,
            account
        );
    }

    function isBoardMember(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.BOARD_MEMBER_ROLE,
            account
        );
    }

    function isAssemblyAdmin(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.ASSEMBLY_ADMIN_ROLE,
            account
        );
    }

    function isResponsible(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.RESPONSIBLE_ROLE,
            account
        );
    }

    function isProposer(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.PROPOSER_ROLE,
            account
        );
    }

    function isMember(address account) external view returns (bool) {
        return LibAccessControl.hasRole(
            LibAccessControl.MEMBER_ROLE,
            account
        );
    }

}

==================== src/facets/governance/university-governance/UniversityGovernanceFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {UniversityGovernanceStorage} from "./storage/UniversityGovernanceStorage.sol";

contract UniversityGovernanceFacet {

    function us()
        internal
        pure
        returns (UniversityGovernanceStorage.Layout storage)
    {
        return UniversityGovernanceStorage.layout();
    }

    // EVENTS
    event UniversityInitialized();
    event MemberAdded(address member);
    event SessionOpened();
    event ResolutionCreated(uint256 id, string description);
    event Voted(address voter, uint256 resolutionId, bool support);
    event ResolutionClosed(uint256 id, bool approved);
    event ExecutorAssigned(uint256 id, address executor);
    event ActivityCompleted(uint256 id, address executor);
    event IncentiveRedeemed(address executor, uint256 amount);

    // ================================
    // INIT (Diamond Safe)
    // ================================

    function initUniversityDao() external {
        UniversityGovernanceStorage.Layout storage s = us();
        require(!s.initialized, "Already initialized");

        s.initialized = true;
        s.sessionActive = false;
        s.quorumPercentage = 40;

        emit UniversityInitialized();
    }

    // ================================
    // MEMBERSHIP
    // ================================

    function addMember(address member) external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();

        require(!s.members[member], "Already member");

        s.members[member] = true;
        s.memberCount++;

        emit MemberAdded(member);
    }

modifier onlyMember() {
    _onlyMember();
    _;
}
function _onlyMember() internal view {
    require(us().members[msg.sender], "Not assembly member");
}

modifier onlyAdmin() {
    _onlyAdmin();
    _;
}
function _onlyAdmin() internal view {
    require(
        AppStorage.layout().owner == msg.sender,
        "Not admin"
    );
}
    // ================================
    // SESSION
    // ================================

    function openUniversitySession() external onlyAdmin {
        UniversityGovernanceStorage.Layout storage s = us();
        require(!s.sessionActive, "Session active");

        s.sessionActive = true;

        emit SessionOpened();
    }

    // ================================
    // RESOLUTIONS
    // ================================

    function createUniversityResolution(string calldata description)
        external onlyMember
    {
        UniversityGovernanceStorage.Layout storage s = us();
        require(s.sessionActive, "Session not active");

        uint256 id = s.resolutionCount;

        UniversityGovernanceStorage.Resolution storage r =
            s.resolutions[id];

        r.description = description;
        r.status =
            UniversityGovernanceStorage.ResolutionStatus.Created;

        s.resolutionCount++;

        emit ResolutionCreated(id, description);
    }

function startDeliberation(uint256 resolutionId) external onlyMember {

    UniversityGovernanceStorage.Layout storage s =
        UniversityGovernanceStorage.layout();

    UniversityGovernanceStorage.Resolution storage r =
        s.resolutions[resolutionId];

    require(r.deliberationDeadline == 0, "Deliberation already started");

    r.deliberationDeadline = block.timestamp + 25 minutes;
}


function startVoting(uint256 id) external onlyMember {

    UniversityGovernanceStorage.Layout storage s = us();

    UniversityGovernanceStorage.Resolution storage r =
        s.resolutions[id];

    require(
        block.timestamp >= r.deliberationDeadline,
        "Deliberation not finished"
    );

    r.votingDeadline = block.timestamp + 15 minutes;
}


function voteUniversity(uint256 id, bool support)
    external
    onlyMember
{
    UniversityGovernanceStorage.Layout storage s = us();

    UniversityGovernanceStorage.Resolution storage r =
        s.resolutions[id];

    require(
        block.timestamp >= r.deliberationDeadline,
        "Deliberation not finished"
    );

    require(
        block.timestamp <= r.votingDeadline,
        "Voting closed"
    );

    require(!r.voted[msg.sender], "Already voted");

    r.voted[msg.sender] = true;

    if (support) {
        r.yesVotes++;
    } else {
        r.noVotes++;
    }

    emit Voted(msg.sender, id, support);
}

	function closeUniversityResolution(uint256 id) external {

        UniversityGovernanceStorage.Layout storage s = us();
        UniversityGovernanceStorage.Resolution storage r =
            s.resolutions[id];

        require(
            r.status ==
                UniversityGovernanceStorage.ResolutionStatus.Created,
            "Already closed"
        );

        uint256 totalVotes = r.yesVotes + r.noVotes;
        uint256 quorum =
            (s.memberCount * s.quorumPercentage) / 100;

        if (totalVotes < quorum) {
            r.status =
                UniversityGovernanceStorage.ResolutionStatus.Rejected;
        } else if (r.yesVotes > r.noVotes) {
            r.status =
                UniversityGovernanceStorage.ResolutionStatus.Approved;
        } else {
            r.status =
                UniversityGovernanceStorage.ResolutionStatus.Rejected;
        }

        emit ResolutionClosed(
            id,
            r.status ==
                UniversityGovernanceStorage.ResolutionStatus.Approved
        );
    }

    // ================================
    // EXECUTION FLOW
    // ================================

    function assignExecutor(uint256 id, address executor) external {

        UniversityGovernanceStorage.Resolution storage r =
            us().resolutions[id];

        require(
            r.status ==
                UniversityGovernanceStorage.ResolutionStatus.Approved,
            "Not approved"
        );

	require(r.executor == address(0), "Executor already assigned");
        r.executor = executor;
        us().executors[executor].assigned = true;

        emit ExecutorAssigned(id, executor);
    }

    function markActivityCompleted(uint256 id) external {

        UniversityGovernanceStorage.Layout storage s = us();
        UniversityGovernanceStorage.Resolution storage r =
            s.resolutions[id];

        require(msg.sender == r.executor, "Not executor");
        require(!r.executed, "Already executed");

        r.executed = true;
        r.status =
            UniversityGovernanceStorage.ResolutionStatus.Executed;

        s.executors[msg.sender].completedActivities++;
        s.executors[msg.sender].redeemableRewards += 10 ether;

        emit ActivityCompleted(id, msg.sender);
    }

    function redeemIncentive() external {

        UniversityGovernanceStorage.Executor storage ex =
            us().executors[msg.sender];

        uint256 reward = ex.redeemableRewards;
        require(reward > 0, "No rewards");

        ex.redeemableRewards = 0;
	
	AppStorage.Layout storage s = AppStorage.layout();
	s.nudosBalance[msg.sender] += reward;

        emit IncentiveRedeemed(msg.sender, reward);
    }
}

==================== src/facets/governance/university-governance/UniversityGovernanceViewFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {UniversityGovernanceStorage}
from "./storage/UniversityGovernanceStorage.sol";

contract UniversityGovernanceViewFacet {

    function us()
        internal
        pure
        returns (UniversityGovernanceStorage.Layout storage)
    {
        return UniversityGovernanceStorage.layout();
    }

    function getResolution(uint256 id)
        external
        view
        returns (
            string memory description,
            uint256 yesVotes,
            uint256 noVotes,
            UniversityGovernanceStorage.ResolutionStatus status,
            address executor,
            bool executed
        )
    {
        UniversityGovernanceStorage.Resolution storage r =
            us().resolutions[id];

        return (
            r.description,
            r.yesVotes,
            r.noVotes,
            r.status,
            r.executor,
            r.executed
        );
    }

    function isMember(address user)
        external
        view
        returns (bool)
    {
        return us().members[user];
    }

    function getResolutionCount()
        external
        view
        returns (uint256)
    {
        return us().resolutionCount;
    }

    function getExecutorInfo(address user)
        external
        view
        returns (
            uint256 completedActivities,
            uint256 redeemableRewards
        )
    {
        UniversityGovernanceStorage.Executor storage ex =
            us().executors[user];

        return (
            ex.completedActivities,
            ex.redeemableRewards
        );
    }
}

==================== src/facets/impact/ImpactCredentialFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ImpactCredentialFacet {

    event ImpactCredentialMinted(
        uint256 indexed tokenId,
        address indexed user,
        uint256 year,
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass,
        uint256 co2Saved
    );

    struct Credential {
        address user;
        uint256 year;
        uint256 aluminium;
        uint256 plastic;
        uint256 cardboard;
        uint256 glass;
        uint256 co2Saved;
    }

function mintImpactCredential(address user, uint256 year) external {

    AppStorage.Layout storage s = AppStorage.layout();

    require(s.profiles[user].exists, "User not found");

    // 🚫 evitar doble mint por año
    require(
        !s.userYearCredentialMinted[user][year],
        "Credential already minted for year"
    );

    AppStorage.UserImpactTotals storage totals =
        s.userImpactTotals[user];

    uint256 aluminium = totals.aluminium;
    uint256 plastic = totals.plastic;
    uint256 cardboard = totals.cardboard;
    uint256 glass = totals.glass;

    uint256 co2Saved =
        aluminium * 9 +
        plastic * 6 +
        cardboard * 3 +
        glass * 1;

    uint256 tokenId = ++s.nextImpactCredentialId;

    s.impactCredentials[tokenId] = AppStorage.ImpactCredential(
        user,
        year,
        aluminium,
        plastic,
        cardboard,
        glass,
        co2Saved
    );

    s.userImpactCredentials[user].push(tokenId);

    // ✅ marcar como mintado
    s.userYearCredentialMinted[user][year] = true;

    emit ImpactCredentialMinted(
        tokenId,
        user,
        year,
        aluminium,
        plastic,
        cardboard,
        glass,
        co2Saved
    );
}

    function getCredential(uint256 tokenId)
        external
        view
	returns (AppStorage.ImpactCredential memory)
    {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.impactCredentials[tokenId];
    }

    function getUserCredentials(address user)
        external
        view
        returns (uint256[] memory)
    {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.userImpactCredentials[user];
    }
}

==================== src/facets/impact/ImpactFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ImpactFacet {

    // =============================================================
    // USER IMPACT
    // =============================================================

    function getUserImpact(address user)
        external
        view
        returns (
            uint256 aluminium,
            uint256 plastic,
            uint256 cardboard,
            uint256 glass
        )
    {
        AppStorage.Layout storage s = AppStorage.layout();

AppStorage.UserImpactTotals storage totals =
    s.userImpactTotals[user];

return (
    totals.aluminium,
    totals.plastic,
    totals.cardboard,
    totals.glass
);

    }

    // =============================================================
    // CAMPUS IMPACT
    // =============================================================

function getCampusImpact(uint256 campusId)
    external
    view
    returns (
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass
    )
{
    AppStorage.UserImpactTotals storage totals =
        AppStorage.layout().campusImpactTotals[campusId];

    return (
        totals.aluminium,
        totals.plastic,
        totals.cardboard,
        totals.glass
    );
}

    // =============================================================
    // UNIVERSITY IMPACT
    // =============================================================

function getUniversityImpact(uint256 universityId)
    external
    view
    returns (
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass
    )
{
    AppStorage.UserImpactTotals storage totals =
        AppStorage.layout().universityImpactTotals[universityId];

    return (
        totals.aluminium,
        totals.plastic,
        totals.cardboard,
        totals.glass
    );
}

// =============================================================
// TOP RECYCLERS LEADERBOARD
// =============================================================

function getTopRecyclers(uint256 limit)
    external
    view
    returns (address[] memory users, uint256[] memory scores)
{
    AppStorage.Layout storage s = AppStorage.layout();

    address[] storage owners = s.profileOwners;

uint256 length = owners.length;

if (limit > length) {
    limit = length;
}

users = new address[](limit);
scores = new uint256[](limit);

    for (uint256 i = 0; i < length; i++) {

        address user = owners[i];

        uint256 score =
            s.userImpactTotals[user].aluminium +
            s.userImpactTotals[user].plastic +
            s.userImpactTotals[user].cardboard +
            s.userImpactTotals[user].glass;

        for (uint256 k = 0; k < limit; k++) {

            if (score > scores[k]) {

                for (uint256 m = limit - 1; m > k; m--) {
                    users[m] = users[m - 1];
                    scores[m] = scores[m - 1];
                }

                users[k] = user;
                scores[k] = score;
                break;
            }
        }
    }
}

// =============================================================
// LAZOS SUSTAINABILITY SCORE
// =============================================================

function getSustainabilityScore(address user)
    external
    view
    returns (uint256 score)
{
    AppStorage.Layout storage s = AppStorage.layout();

AppStorage.UserImpactTotals storage totals =
    s.userImpactTotals[user];

uint256 co2Saved =
    totals.aluminium * 9 +
    totals.plastic * 6 +
    totals.cardboard * 3 +
    totals.glass * 1;

score =
    totals.aluminium * 10 +
    totals.plastic * 6 +
    totals.cardboard * 4 +
    totals.glass * 2 +
    co2Saved;
}

// =============================================================
// IMPACT DASHBOARD API
// =============================================================

function getImpactDashboard(address user)
    external
    view
    returns (
        uint256 aluminium,
        uint256 plastic,
        uint256 cardboard,
        uint256 glass,
        uint256 co2Saved,
        uint256 sustainabilityScore
    )
{
    AppStorage.Layout storage s = AppStorage.layout();

    AppStorage.UserImpactTotals storage totals =
        s.userImpactTotals[user];

    aluminium = totals.aluminium;
    plastic = totals.plastic;
    cardboard = totals.cardboard;
    glass = totals.glass;

    co2Saved =
        aluminium * 9 +
        plastic * 6 +
        cardboard * 3 +
        glass * 1;

    sustainabilityScore =
        aluminium * 10 +
        plastic * 6 +
        cardboard * 4 +
        glass * 2 +
        co2Saved;
	}

}

==================== src/facets/impact/ImpactLeaderboardFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ImpactLeaderboardFacet {

    function getTopRecyclers(uint256 limit)
        external
        view
        returns (address[] memory users, uint256[] memory totals)
    {
        AppStorage.Layout storage s = AppStorage.layout();
        uint256 length = s.recyclerIndex.length;

        // Caso base: no hay datos
        if (length == 0 || limit == 0) {
            return (new address[](0), new uint256[](0));
        }

        // Ajustar limit
        uint256 resultSize = limit > length ? length : limit;

        users = new address[](resultSize);
        totals = new uint256[](resultSize);

        for (uint256 i = 0; i < length; i++) {
            address user = s.recyclerIndex[i];
            
            // Cargamos en memoria para ahorrar gas de lectura
            AppStorage.UserImpactTotals memory impact = s.userImpactTotals[user];

            uint256 total = impact.aluminium +
                impact.plastic +
                impact.cardboard +
                impact.glass;

            // Insertion sort parcial
            for (uint256 j = 0; j < resultSize; j++) {
                if (total > totals[j]) {
                    // Shift hacia abajo
                    for (uint256 k = resultSize - 1; k > j; k--) {
                        totals[k] = totals[k - 1];
                        users[k] = users[k - 1];
                    }
                    totals[j] = total;
                    users[j] = user;
                    break;
                }
            }
        }
    }
}

==================== src/facets/machines/MachineFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract MachineFacet {

    event MachineRegistered(
        uint256 indexed machineId,
        uint256 campusId,
        address operator
    );

    event MachineStatusUpdated(
        uint256 indexed machineId,
        bool active
    );


function registerMachine(
        uint256 campusId,
        string calldata metadataURI,
        address operator
    ) external {

	require(campusId != 0, "Invalid campus");

        AppStorage.Layout storage s = AppStorage.layout();

	require(s.campuses[campusId].id != 0, "Campus not found");
        require(msg.sender == s.owner, "Not owner");

        uint256 machineId = ++s.nextMachineId;

        s.machines[machineId] = AppStorage.Machine({
            id: machineId,
            campusId: campusId,
            metadataURI: metadataURI,
            operator: operator,
            active: true
        });

        s.machineIds.push(machineId);

        emit MachineRegistered(
            machineId,
            campusId,
            operator
        );
    }

function setMachineStatus(
        uint256 machineId,
        bool active
    ) external {

        AppStorage.Layout storage s = AppStorage.layout();

        require(msg.sender == s.owner, "Not owner");
        s.machines[machineId].active = active;


        emit MachineStatusUpdated(machineId, active);
    }

function getMachine(uint256 machineId)
        external
        view
        returns (AppStorage.Machine memory)
    {
        return AppStorage.layout().machines[machineId];
    }

function getMachines()
        external
        view
        returns (uint256[] memory)
    {
        return AppStorage.layout().machineIds;
    }

function linkOracleToMachine(
    address oracle,
    uint256 machineId
) external {

    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == s.owner, "Not owner");
    require(oracle != address(0), "Zero oracle");
    require(s.machines[machineId].id != 0, "Machine not found");
    require(s.machines[machineId].active, "Machine inactive");
    require(!s.recyclingOracles[oracle], "Oracle already active");

    require(
        s.oracleMachine[oracle] == 0,
        "Oracle already linked"
    );

    s.recyclingOracles[oracle] = true;
    s.oracleMachine[oracle] = machineId;
}

function unlinkOracle(address oracle) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == s.owner, "Not owner");

    s.recyclingOracles[oracle] = false;
    s.oracleMachine[oracle] = 0;
}

}

==================== src/facets/marketplace/MarketplaceFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract MarketplaceFacet {
    using AppStorage for AppStorage.Layout;

    event ItemCreated(uint256 indexed itemId, address indexed owner, uint8 itemType, uint256 price);
    event ItemListed(uint256 indexed itemId, uint256 price);
    event ItemSold(uint256 indexed itemId, address indexed buyer, uint256 price);
    event TradeProposed(uint256 indexed tradeId, uint256 itemA, uint256 itemB, address proposer);
    event TradeAccepted(uint256 indexed tradeId, address accepter);

    function createItem(uint8 itemType, string calldata metadataURI, uint256 price) external returns (uint256) {
        AppStorage.Layout storage s = AppStorage.layout();
        uint256 id = ++s.nextItemId;
	require(bytes(metadataURI).length > 0, "Metadata required");

        s.items[id] = AppStorage.Item({
            id: id,
            owner: msg.sender,
            itemType: itemType,
            metadataURI: metadataURI,
            price: price,
            status: AppStorage.ItemStatus.Unlisted
        });

        emit ItemCreated(id, msg.sender, itemType, price);
        return id;
    }

    function listItem(uint256 itemId, uint256 price) external {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Item storage it = s.items[itemId];

require(it.id != 0, "Item does not exist");
require(it.owner == msg.sender, "Not owner");
require(price > 0, "Price must be > 0");

it.price = price;
it.status = AppStorage.ItemStatus.Listed;

        emit ItemListed(itemId, price);
    }

function buyWithTokens(uint256 itemId) external {
    AppStorage.Layout storage s = AppStorage.layout();
    AppStorage.Item storage it = s.items[itemId];

    require(it.id != 0, "Item does not exist");
    require(it.status == AppStorage.ItemStatus.Listed, "Not for sale");
    require(it.owner != msg.sender, "Cannot buy your own item");
    require(it.price > 0, "Invalid price");

    uint256 price = it.price;
require(s.lastPurchaseBlock[msg.sender] < block.number, "One tx per block");
s.lastPurchaseBlock[msg.sender] = block.number;

uint256 buyerBalance = s.nudosBalance[msg.sender];
require(buyerBalance >= price, "Insufficient balance");

    // 💰 calcular fee
    uint256 fee = (price * s.marketplaceFeeBps) / 10000;
    uint256 sellerAmount = price - fee;

    address seller = it.owner;

    // 🔄 actualizar balances
s.nudosBalance[msg.sender] -= price;
s.nudosBalance[seller] += sellerAmount;
s.nudosBalance[address(this)] += fee; // treasury vive en el contrato

    // 🔁 transferir ownership
    it.owner = msg.sender;
    it.status = AppStorage.ItemStatus.Sold;

    emit ItemSold(itemId, msg.sender, price);
}

    function proposeTrade(uint256 itemA, uint256 itemB) external returns (uint256) {
        AppStorage.Layout storage s = AppStorage.layout();
        require(s.items[itemA].owner == msg.sender, "Not owner of itemA");

        uint256 id = ++s.nextTradeId;
        s.trades[id] = AppStorage.Trade({id: id, proposer: msg.sender, itemA: itemA, itemB: itemB, accepted: false});

        emit TradeProposed(id, itemA, itemB, msg.sender);
        return id;
    }

function acceptTrade(uint256 tradeId) external {
    AppStorage.Layout storage s = AppStorage.layout();
    AppStorage.Trade storage t = s.trades[tradeId];

    require(t.id != 0, "Trade does not exist");
    require(!t.accepted, "Already accepted");

    AppStorage.Item storage itemA = s.items[t.itemA];
    AppStorage.Item storage itemB = s.items[t.itemB];

    require(itemA.id != 0 && itemB.id != 0, "Invalid items");
    require(itemB.owner == msg.sender, "Not owner of itemB");
    require(itemA.owner == t.proposer, "Ownership changed");

    address ownerA = itemA.owner;
    address ownerB = itemB.owner;

    itemA.owner = ownerB;
    itemB.owner = ownerA;

    t.accepted = true;

    emit TradeAccepted(tradeId, msg.sender);
}

    function rateItem(uint256 itemId, uint8 rating) external {
AppStorage.Layout storage s = AppStorage.layout();

require(s.items[itemId].id != 0, "Item does not exist");
require(rating > 0 && rating <= 5, "Invalid rating");

s.ratings[itemId][msg.sender] = rating;
    }

    function getItem(uint256 itemId)
        external
        view
        returns (address owner, uint8 itemType, string memory metadataURI, uint256 price, uint8 status)
    {
        AppStorage.Item storage it = AppStorage.layout().items[itemId];
        return (it.owner, it.itemType, it.metadataURI, it.price, uint8(it.status));
    }

function executeMarketplaceFee(uint256 feeBps) external {
    AppStorage.Layout storage s = AppStorage.layout();

    // 🔐 SOLO ejecución interna (DAO)
    require(msg.sender == address(this), "Only DAO");

    require(feeBps <= 1000, "Max 10%");

    s.marketplaceFeeBps = feeBps;
}

function spendTreasury(address to, uint256 amount) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(msg.sender == address(this), "Only DAO");
    require(to != address(0), "Invalid address");
    require(amount > 0, "Invalid amount");

    require(
        s.nudosBalance[address(this)] >= amount,
        "Insufficient treasury"
    );

    s.nudosBalance[address(this)] -= amount;
    s.nudosBalance[to] += amount;
}

}

==================== src/facets/profile/ProfileFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ProfileFacet {

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event ProfileRegistered(
        address indexed owner,
        uint256 universityId,
        uint8 role
    );

    event ProfileUpdated(address indexed owner);

    /*//////////////////////////////////////////////////////////////
                           PROFILE MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function registerProfile(
        string calldata metadataURI,
        uint256 universityId,
        uint8 role
    ) external {

AppStorage.Layout storage s = AppStorage.layout();

require(universityId != 0, "Invalid university");
require(s.universities[universityId].id != 0, "University not found");
require(role <= uint8(type(AppStorage.Role).max), "Invalid role");

AppStorage.Profile storage p = s.profiles[msg.sender];

require(!p.exists, "Profile already exists");

        p.owner = msg.sender;
        p.metadataURI = metadataURI;
        p.universityId = universityId;
        p.role = AppStorage.Role(role);
        p.exists = true;

        s.profileOwners.push(msg.sender);

        emit ProfileRegistered(msg.sender, universityId, role);
    }

    function updateProfile(string calldata metadataURI) external {

        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Profile storage p = s.profiles[msg.sender];

        require(p.exists, "Profile not found");

        p.metadataURI = metadataURI;

        emit ProfileUpdated(msg.sender);
    }

    function getProfile(address owner)
        external
        view
        returns (
            address,
            string memory,
            uint256,
            uint8
        )
    {
        AppStorage.Profile storage p =
            AppStorage.layout().profiles[owner];

        require(p.exists, "Profile not found");

        return (
            p.owner,
            p.metadataURI,
            p.universityId,
            uint8(p.role)
        );
    }

    function listProfiles()
        external
        view
        returns (address[] memory)
    {
        return AppStorage.layout().profileOwners;
    }
}

==================== src/facets/recycling/CampusFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract CampusFacet {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event CampusCreated(uint256 indexed campusId, string name);
    event CampusUpdated(uint256 indexed campusId, string name);
    event CampusStaffAdded(uint256 indexed campusId, address staff);
    event CampusStaffRemoved(uint256 indexed campusId, address staff);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyUniversityStaff() {
        _checkUniversityStaff();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           CAMPUS MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function _checkUniversityStaff() internal view {
        AppStorage.Layout storage s = AppStorage.layout();
        require(s.isUniversityStaff[msg.sender], "CampusFacet: not university staff");
    }

function createCampus(
    uint256 campusId,
    uint256 universityId,
    string calldata name,
    string calldata metadataURI
) external onlyUniversityStaff {

    AppStorage.Layout storage s = AppStorage.layout();
    AppStorage.Campus storage c = s.campuses[campusId];

    require(s.universities[universityId].id != 0, "University not found");

    require(c.id == 0, "Campus exists");

    c.id = campusId;
    c.universityId = universityId;
    c.name = name;
    c.metadataURI = metadataURI;

    // 🔗 LINK BIDIRECCIONAL
    s.universities[universityId].campusIds.push(campusId);
    s.campusIds.push(campusId);

    emit CampusCreated(campusId, name);
}

    function updateCampus(uint256 campusId, string calldata newName, string calldata newMetadataURI)
        external
        onlyUniversityStaff
    {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Campus storage c = s.campuses[campusId];

        require(bytes(c.name).length != 0, "Campus not found");

        c.name = newName;
        c.metadataURI = newMetadataURI;

        emit CampusUpdated(campusId, newName);
    }

    function addCampusStaff(uint256 campusId, address staff) external onlyUniversityStaff {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Campus storage c = s.campuses[campusId];

        if (!c.isStaff[staff]) {
            c.isStaff[staff] = true;
            c.staffList.push(staff);
            emit CampusStaffAdded(campusId, staff);
        }
    }

    function removeCampusStaff(uint256 campusId, address staff) external onlyUniversityStaff {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Campus storage c = s.campuses[campusId];

        if (c.isStaff[staff]) {
            c.isStaff[staff] = false;
            emit CampusStaffRemoved(campusId, staff);
        }
    }

    function isCampusStaff(uint256 campusId, address who) external view returns (bool) {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.campuses[campusId].isStaff[who];
    }

    function getCampus(uint256 campusId)
        external
        view
        returns (uint256 id, string memory name, string memory metadataURI, address[] memory staffList)
    {
        AppStorage.Layout storage s = AppStorage.layout();
        AppStorage.Campus storage c = s.campuses[campusId];

        return (c.id, c.name, c.metadataURI, c.staffList);
    }

    function listCampusIds() external view returns (uint256[] memory) {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.campusIds;
    }
}

==================== src/facets/recycling/ProofOfRecyclingFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ProofOfRecyclingFacet {

    event RecyclingBadgeMinted(address indexed user, uint256 level);

    function checkAndMintBadge(address user) external {

        AppStorage.Layout storage s = AppStorage.layout();

        uint256 actions = s.userImpactTotals[user].totalActions;

        uint256 level = actions / 100;

        if (level == 0) return;

        if (level > s.userBadgeLevel[user]) {

            s.userBadgeLevel[user] = level;

            emit RecyclingBadgeMinted(user, level);
        }
    }

    function getBadgeLevel(address user)
        external
        view
        returns (uint256)
    {
        return AppStorage.layout().userBadgeLevel[user];
    }
}

==================== src/facets/recycling/RecycleFacet.sol ====================
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

    AppStorage.MaterialRecord memory record =
        AppStorage.MaterialRecord({
            aluminium: aluminium,
            plastic: plastic,
            cardboard: cardboard,
            glass: glass,
            timestamp: block.timestamp
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

    uint256 reward =
        aluminium * s.recycleRates[AppStorage.Material.AL] +
        plastic * s.recycleRates[AppStorage.Material.PL] +
        cardboard * s.recycleRates[AppStorage.Material.CB] +
        glass * s.recycleRates[AppStorage.Material.GL];

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

require(users.length <= 50, "Batch too large");

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

        require(al <= 50, "Too many aluminium");
        require(pl <= 50, "Too many plastic");
        require(cb <= 50, "Too many cardboard");
        require(gl <= 50, "Too many glass");

        if (al + pl + cb + gl == 0) continue;

        // ------------------------------------
        // HISTORY
        // ------------------------------------

        AppStorage.MaterialRecord memory record =
            AppStorage.MaterialRecord({
                aluminium: al,
                plastic: pl,
                cardboard: cb,
                glass: gl,
                timestamp: block.timestamp
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

        uint256 reward =
            al * s.recycleRates[AppStorage.Material.AL] +
            pl * s.recycleRates[AppStorage.Material.PL] +
            cb * s.recycleRates[AppStorage.Material.CB] +
            gl * s.recycleRates[AppStorage.Material.GL];

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


function getUserImpact(address user)
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

==================== src/facets/recycling/UniversityFacet.sol ====================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract UniversityFacet {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event ProfileRegistered(address indexed owner, uint256 universityId, uint8 role);
    event ProfileUpdated(address indexed owner);
    event UniversityStaffAdded(address indexed staff);
    event UniversityStaffRemoved(address indexed staff);
    event UniversityCreated(uint256 indexed universityId, string name);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyUniversityStaff() {
        _checkUniversityStaff();
        _;
    }

    function _checkUniversityStaff() internal view {
        AppStorage.Layout storage s = AppStorage.layout();
        require(s.isUniversityStaff[msg.sender], "UniversityFacet: not university staff");
    }

    /*//////////////////////////////////////////////////////////////
                       UNIVERSITY STAFF MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function addUniversityStaff(address staff) external onlyUniversityStaff {
        AppStorage.Layout storage s = AppStorage.layout();
        if (!s.isUniversityStaff[staff]) {
            s.isUniversityStaff[staff] = true;
            emit UniversityStaffAdded(staff);
        }
    }

    function removeUniversityStaff(address staff) external onlyUniversityStaff {
        AppStorage.Layout storage s = AppStorage.layout();
        if (s.isUniversityStaff[staff]) {
            s.isUniversityStaff[staff] = false;
            emit UniversityStaffRemoved(staff);
        }
    }

    function isUniversityStaff(address who) external view returns (bool) {
        AppStorage.Layout storage s = AppStorage.layout();
        return s.isUniversityStaff[who];
    }

    function createUniversity(
    uint256 universityId,
    string calldata name,
    string calldata metadataURI
	) external {

    AppStorage.Layout storage s = AppStorage.layout();
    require(msg.sender == s.owner, "Not owner");

    AppStorage.University storage u = s.universities[universityId];
    require(bytes(u.name).length == 0, "University exists");

    u.id = universityId;
    u.name = name;
    u.metadataURI = metadataURI;

    s.universityIds.push(universityId);

    emit UniversityCreated(universityId, name);
}

function getUniversity(uint256 universityId)
    external
    view
    returns (
        uint256 id,
        string memory name,
        string memory metadataURI,
        uint256[] memory campusIds
    )
{
    AppStorage.University storage u = AppStorage.layout().universities[universityId];

    return (u.id, u.name, u.metadataURI, u.campusIds);
}

}

