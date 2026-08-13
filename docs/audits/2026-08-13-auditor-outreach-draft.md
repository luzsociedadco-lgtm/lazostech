# NUDOS independent security audit outreach - draft

Status: **READY TO SEND AFTER THE RELEASE COMMIT IS FROZEN**.

This file prepares an audit request. It does not select a vendor, accept a
quote, spend funds, submit a form, or represent that an audit has started.

## Shortlist

Request comparable proposals from at least three independent reviewers with
documented Solidity/EVM and upgradeable Diamond experience:

1. OpenZeppelin Security Audits:
   <https://www.openzeppelin.com/security-audits>
2. Trail of Bits Software Assurance:
   <https://www.trailofbits.com/services/software-assurance>
3. Cyfrin Blockchain Audits:
   <https://www.cyfrin.io/blockchain-audits>
4. Spearbit:
   <https://spearbit.com/>

The list is not an endorsement. Compare the named reviewers, independence,
scope, schedule, methodology, retest terms, report-publication terms, price,
and conflicts of interest before selection.

## Request message

Subject: NUDOS EIP-2535 / fixed-supply token independent audit request

> Hello,
>
> LazosTech is preparing NUDOS, an EVM application on Base built around an
> EIP-2535 Diamond, a fixed-supply ERC-20 token, Safe-governed upgrades and
> application operator roles. We are requesting an independent security audit
> before any NUDOS contract is deployed to Base Mainnet.
>
> The frozen release commit and exact scope will be provided with the attached
> audit handoff. The priority areas are Diamond selector/storage integrity,
> privilege boundaries, initialization and ownership, token distribution,
> reward/treasury accounting, replay/reentrancy/denial-of-service, deployment
> guards, Safe governance and server-side relayer surfaces.
>
> Please provide: proposed scope and exclusions, named reviewer profile,
> methodology and tools, estimated calendar, price and payment milestones,
> fix-review/retest terms, final-report format/publication terms, and any
> conflict of interest. The acceptance gate requires a final report with zero
> unresolved critical or high findings.
>
> This request is for a proposal only and does not authorize work until a
> written engagement is accepted.

## Material to attach

- frozen release commit and repository/PR link;
- `docs/audits/2026-08-12-external-audit-handoff.md`;
- architecture, tokenomics, deployment and operations documents in the frozen
  release;
- reproducible Foundry commands and compiler/tool versions;
- known coverage and compiler-warning limitations;
- point of contact and intended review window, supplied outside the public
  repository.

## Comparable quote worksheet

| Field | Vendor A | Vendor B | Vendor C |
| --- | --- | --- | --- |
| Named reviewers | PENDING | PENDING | PENDING |
| Relevant Diamond/Base work | PENDING | PENDING | PENDING |
| Exact in-scope commit/files | PENDING | PENDING | PENDING |
| Calendar and duration | PENDING | PENDING | PENDING |
| Price and payment terms | PENDING | PENDING | PENDING |
| Fix review included | PENDING | PENDING | PENDING |
| Public final report allowed | PENDING | PENDING | PENDING |
| Conflicts disclosed | PENDING | PENDING | PENDING |

Submitting any request or accepting any engagement requires explicit approval
of the final recipient, frozen commit, disclosed project information, budget,
and legal/commercial terms.
