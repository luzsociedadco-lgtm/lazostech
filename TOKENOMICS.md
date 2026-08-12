# Tokenomics

The LazosTech platform includes a token-based incentive system designed to reward verified social and environmental impact.

The goal of the token economy is to encourage participation in governance activities, environmental initiatives, and institutional programs.

---

# NUDOS Token

NUDOS is the native incentive token used within the LazosTech ecosystem.

The token rewards verified contributions and participation in governance-approved activities.

Participants can earn NUDOS tokens through:

* verified governance missions
* environmental initiatives such as recycling
* participation in institutional programs
* approved community activities

## Proposed production policy

Approval status: **APPROVED on 2026-08-10**.

The supply, allocation, vesting, distribution restrictions and reward-treasury
funding plan in this section were founder-approved on 2026-08-10. Production
deployment and public availability remain subject to the separate security,
operations and token/privacy legal gates.

### Supply, minting, burn and upgrade policy

* Fixed supply: exactly `1,000,000 NUDOS` with 18 decimals.
* Post-launch minting: prohibited; the token exposes no mint authority.
* Burning: no protocol burn, buyback-and-burn, or supply-reduction program.
* Pausing: the token cannot be paused by an owner or administrator.
* Upgrades: the token is immutable and is not deployed behind a proxy.
* Replacement: any future token replacement requires a new audited contract,
  legal review, migration plan, Board approval and a threshold-approved Safe
  transaction. It cannot increase this token's supply.

### Genesis allocation

| Economic allocation | On-chain destination at genesis | Amount | Share | Launch purpose |
| --- | --- | ---: | ---: | --- |
| Diamond replenishment reserve | Base Mainnet Safe | `600,000 NUDOS` | 60% | Restricted reserve for reward-treasury top-ups |
| Founding-team reserve | Base Mainnet Safe | `300,000 NUDOS` | 30% | Locked pending audited vesting deployment |
| Diamond working balance | NUDOS Diamond | `100,000 NUDOS` | 10% | Initial verified-reward operating treasury |

The complete supply is allocated by the constructor: `900,000 NUDOS` go to the
Safe and `100,000 NUDOS` go to the Diamond. The two Safe-controlled allocations
are accounting restrictions enforced by the approved treasury policy and Safe
execution process; they are not separate balances in the ERC-20 constructor.

At launch there is no investor, adviser, partner, public-sale or liquidity
allocation. The `600,000 NUDOS` replenishment reserve and unvested portion of
the `300,000 NUDOS` founding-team reserve are not circulating supply.

### Distribution and vesting policy

* Rewards leave the Diamond only after a supported activity is verified. A
  single `grantReward` call is capped in code at `100 NUDOS`.
* Ticket redemptions and marketplace fees transfer NUDOS back to the Diamond.
  Marketplace seller payments circulate between participants while the fee
  remains in the Diamond.
* Every release from the Safe reserve requires a written purpose, recipient,
  amount, applicable restrictions and a threshold-approved Safe transaction.
* The `300,000 NUDOS` founding-team reserve remains in the Safe until an audited
  vesting contract, beneficiary list and schedule are approved. Direct
  discretionary transfers to beneficiary EOAs are not an approved vesting
  mechanism.
* The approved founding-team schedule has no release during the first 12
  months. Beginning in month 13, each approved beneficiary vests a cumulative
  `1/36` of their allocation per month through month 48. The final release
  includes any rounding remainder so that the approved beneficiary allocations
  total exactly `300,000 NUDOS`.
* Individual beneficiary allocations must sum to `300,000 NUDOS` and must be
  recorded before deployment. The beneficiary list, leaver terms and vesting
  contract still require legal review and external security review; until those
  implementation gates pass, the complete founding-team reserve remains locked
  in the Safe.
* A future adviser, partner or contributor allocation requires a separate Board
  decision, legal approval and an audited vesting contract before any tokens
  leave the Safe.
* Public sales, exchange listings and liquidity provisioning are disabled at
  launch. Each requires separate legal, economic and Safe approval.

### Reward treasury funding and replenishment

The Diamond begins with `100,000 NUDOS`. The Safe earmarks `600,000 NUDOS`
exclusively as its replenishment reserve. The Diamond is replenished only from:

1. NUDOS returned through ticket redemption and protocol/marketplace fees; or
2. a transfer from the `600,000 NUDOS` Safe replenishment reserve.

There is no automatic minting or unaudited transfer authority. The approved
operating threshold is 25% of the `100,000 NUDOS` working balance. When the
Diamond falls below `25,000 NUDOS`, monitoring may automatically create an
alert and prepare a Safe proposal to restore the Diamond to `100,000 NUDOS`,
subject to the documented 90-day reward budget and the available replenishment
reserve.

Automation stops at proposal preparation. Execution still requires the
production Safe threshold. A fully automatic on-chain transfer would require a
separate capped replenishment controller, external audit and new policy
approval; it is not authorized by this launch policy.

A higher operating balance or a transfer from the founding-team reserve is a
policy change and requires a new Board approval plus legal and security review.

Each top-up evidence record must include:

* the Diamond balance before and after the transfer;
* the approved 90-day reward budget and calculated shortfall;
* the Safe transaction hash and its required confirmations;
* the resulting remaining `600,000 NUDOS` replenishment reserve; and
* the approver/date references without private key material.

Emergency top-ups do not bypass the Safe threshold. If reward distribution must
stop, the incident response acts on the Diamond's authorized reward paths and
oracles; the ERC-20 itself has no privileged pause authority.

### Governance and market claims

The Board approves reward rates, budgets and reserve releases. The Base Mainnet
Safe executes treasury decisions, and the Diamond owner applies supported
economic parameters. University governance cannot mint NUDOS or release the
Safe reserve.

NUDOS is not represented by this document as equity, debt, a stablecoin, a
deposit, or a promise of profit or price appreciation. Final public positioning
and availability remain subject to legal review in each launch jurisdiction.

---

# Token Utility

NUDOS tokens can be used for:

* redeeming institutional benefits
* accessing services within the ecosystem
* marketplace transactions
* governance-related rewards

Tokens function as a mechanism to align incentives between participants and institutions.

---

# Reward Mechanism

Tokens are distributed only after an activity has been verified.

```
Resolution created
   ↓
Responsible participant executes activity
   ↓
Activity verified
   ↓
Reward distributed in NUDOS tokens
```

This ensures that tokens are issued only for completed and validated actions.

---

# Governance Control

Economic parameters such as reward rates are controlled by Board governance.

This prevents uncontrolled token issuance and maintains stability within the ecosystem.

The Board may adjust:

* recycling reward rates
* mission reward allocations
* economic parameters affecting token distribution

University governance cannot modify these parameters without board approval.

---

# Environmental Incentives

Recycling activities represent a key environmental incentive within the platform.

Participants who contribute to recycling initiatives may receive token rewards once the activity is verified.

This mechanism promotes sustainable behavior and allows institutions to track environmental contributions transparently.

---

# Economic Stability

To maintain long-term sustainability, the token economy follows several principles:

* rewards are issued only after verification
* economic parameters are controlled by board governance
* token distribution is linked to measurable impact

These safeguards ensure that the incentive system remains aligned with real-world contributions.

---

# Future Development

Future versions of the token system may include:

* expanded marketplace integrations
* additional incentive mechanisms
* partnerships with external sustainability programs

These developments will aim to strengthen the connection between governance participation and measurable social impact.
