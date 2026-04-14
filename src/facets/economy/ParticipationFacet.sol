// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";

contract ParticipationFacet {
    event SubmissionRegistered(bytes32 indexed proposalId, address indexed actor, string evidence);
    event CompletionValidated(bytes32 indexed proposalId, address indexed actor);
    event SubmissionRevoked(bytes32 indexed proposalId, address indexed actor);

function registerSubmission(
    bytes32 proposalId,
    address actor,
    string calldata evidence
) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.recyclingOracles[msg.sender], "NOT_ORACLE");
    require(actor != address(0), "INVALID_ACTOR");
    require(bytes(evidence).length > 0, "EMPTY_EVIDENCE");
    require(bytes(evidence).length <= 280, "EVIDENCE_TOO_LONG");
    require(
        !s.participation[proposalId][actor].submitted,
        "Already submitted"
    );

    s.participation[proposalId][actor].submitted = true;
    s.participation[proposalId][actor].evidence = evidence;

    emit SubmissionRegistered(proposalId, actor, evidence);
}

function revokeSubmission(bytes32 proposalId, address actor) external {
    AppStorage.Layout storage s = AppStorage.layout();

    require(s.recyclingOracles[msg.sender], "NOT_ORACLE");
    require(
        s.participation[proposalId][actor].submitted,
        "Not submitted"
    );
    require(
        !s.participation[proposalId][actor].validated,
        "Already validated"
    );

    delete s.participation[proposalId][actor];

    emit SubmissionRevoked(proposalId, actor);
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
