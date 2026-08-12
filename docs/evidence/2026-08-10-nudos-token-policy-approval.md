# NUDOS token policy approval record

Date: 2026-08-10

## Scope

This record captures the founder decision made for the proposed Base Mainnet
NUDOS token policy. It contains no private keys, wallet secrets or credentials.

## Approved decisions

- Fixed supply: `1,000,000 NUDOS`.
- Post-launch minting: prohibited.
- Privileged burn, pause and upgrade authority: none.
- Genesis on-chain allocation:
  - `900,000 NUDOS` to the production Safe;
  - `100,000 NUDOS` to the NUDOS Diamond working treasury.
- Economic allocation of the Safe balance:
  - `600,000 NUDOS` restricted to Diamond replenishment;
  - `300,000 NUDOS` reserved for the founding team and locked until implemented
    through an audited vesting contract.
- Founding-team vesting schedule:
  - no release during months 0 through 12;
  - monthly cumulative vesting of `1/36` from month 13 through month 48;
  - final-month release includes any rounding remainder;
  - beneficiary allocations must sum to exactly `300,000 NUDOS`.
- Diamond replenishment trigger: balance below `25,000 NUDOS` (25% of the
  `100,000 NUDOS` operating target).
- Replenishment target: restore the Diamond to, but not above, `100,000 NUDOS`
  under the normal policy.
- Automation boundary: monitoring may automatically create an alert and prepare
  a Safe proposal; execution still requires the production Safe threshold.
- Public sales, exchange listings and liquidity provisioning: disabled at
  launch pending separate legal, economic and Safe approvals.
- Every replenishment must preserve the evidence requirements in
  `TOKENOMICS.md`.

## Implementation conditions

The economic schedule is approved, but the beneficiary list, leaver terms and
vesting contract are not yet implemented or audited. Until those conditions
and the separate legal gate pass, the entire `300,000 NUDOS` founding-team
reserve remains locked in the Safe and must not be distributed.

## Readiness interpretation

- Treasury funding plan: **APPROVED**.
- Supply and distribution documentation: **COMPLETE for the current design**.
- Overall token economic policy: **APPROVED**.
- Vesting implementation and legal review: **PENDING SEPARATE GATES**.
- Production deployment: **NOT AUTHORIZED** by this record.
