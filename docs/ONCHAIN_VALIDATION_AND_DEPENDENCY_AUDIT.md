# On-Chain Validation And Dependency Audit

Date: 2026-04-22
Network: Base Sepolia
Pilot diamond: `0xa6181f4564d5E4318e3FAB7904E9624eD0101C46`
Legacy diamond: `0x23433C04D1EC546E365D966eaed054696060C403`

## Current pilot state

### Canonical catalog

- `listUniversityIds()` => `[0, 1000]`
- `listCampusIds()` => `[1, 1001, 1002]`
- `listProgramIds()` => `1001101..1001107`, `1001201..1001208`
- `getRewardToken()` => `0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C`

### Universities

- `getUniversity(0)` => `(0, "Generica", "ipfs://pilot/university/generic", [1])`
- `getUniversity(1000)` => `(1000, "Universidad del Valle", "ipfs://pilot/university/univalle", [1001, 1002])`

### Campuses

- `getCampus(1)` => `(1, 0, "GN", "ipfs://pilot/campus/generic", [])`
- `getCampus(1001)` => `(1001, 1000, "SF", "ipfs://pilot/campus/sf", [])`
- `getCampus(1002)` => `(1002, 1000, "MLD", "ipfs://pilot/campus/mld", [])`

### Profiles registered

- `LAZOSTECH_WALLET`
  - profile => `("ipfs://pilot/profile/lazostech-admin", universityId=1000, role=Student)`
  - affiliation => `(1000, 1001, 0)`
  - internal NUDOS => `0`
  - tickets => `0`

- `USER_TEST`
  - profile => `("ipfs://pilot/profile/user-test", universityId=1000, role=Student)`
  - affiliation => `(1000, 1001, 1001107)`
  - internal NUDOS => `4`
  - tickets => `0`

- `USER2`
  - profile => `("ipfs://pilot/profile/user2-generic", universityId=0, role=Student)`
  - affiliation => `(0, 1, 0)`
  - internal NUDOS => `0`
  - tickets => `0`

### Machines and oracle

- `getMachines()` => `[1]`
- `getValidMachines()` => `[1]`
- `getMachine(1)` => `(1, 1001, "Machine SF - Entrada Cafeteria", ORACLE, true)`

### ERC20 treasury and balances

- `NUDOS_TOKEN.balanceOf(pilotDiamond)` => `100000 NUDOS`
- `NUDOS_TOKEN.balanceOf(legacyDiamond)` => `0`

Tracked wallets at validation time:

- `LAZOSTECH_WALLET` => `898949 ERC20 NUDOS` scaled to token decimals
- `USER_TEST` => `1051 ERC20 NUDOS` scaled to token decimals
- `USER2` => `0`
- `ORACLE` => `0`

## Legacy cleanup result

The cleanup strategy used here was:

1. deploy a fresh canonical diamond
2. seed only the valid catalog
3. re-register only the desired pilot entities
4. migrate relevant internal balances surgically
5. cut the legacy diamond only enough to rescue the ERC20 treasury

This means the legacy diamond still exists, but it no longer holds the ERC20 treasury.

## Workflow changes already deployed

### Profile

- every new on-chain profile now starts as `Student`
- university support remains limited to `0` and `1000`

### Recycling

Pilot frictions removed from the live upgraded facet:

- machine cooldown
- user cooldown
- material caps per action
- total materials cap
- oracle blocked check
- oracle daily submission limit
- oracle anti-spam timer
- oracle daily impact limit

Still enforced:

- caller must be an active oracle
- user must have a profile
- oracle must be linked to the target machine
- machine must exist and be active
- duplicate recycle hash is still blocked
- action cannot be empty

### University governance

The upgraded pilot model now supports:

- session open / close as separate lifecycle
- active session membership via join / leave
- resolutions that close at the end of voting
- executor assignment after approval
- execution tasks created when the session closes
- incentive accrual through execution tasks instead of leaving resolutions artificially open

New live pieces include:

- `joinUniversitySession()`
- `leaveUniversitySession()`
- `closeUniversitySession()`
- `isActiveMember(address)`
- `getSessionState()`
- `getExecutionTask(uint256)`

## Current dependency picture

### Strong dependencies that remain intentional

- profile must exist before recycling
- machine and oracle linkage must exist before recycling
- only owner/system admin can manage structural catalog
- only authorized staff/admin actors can operate governance administration
- annual and per-recycle credentials still depend on valid impact activity

### Areas intentionally relaxed for pilot

- recycling anti-spam and anti-abuse throttles
- profile role choice at registration
- university catalog creation outside canonical pilot set

### Areas still pending for product E2E

- wallet link still does not auto-write `registerProfile` and `assignProfileAffiliation` from frontend
- internal balances vs ERC20 balances are now modeled separately in the app layer, but frontend still needs live on-chain hydration
- ticket logic is still single-balance lunch logic with `ticketType` accepted only for interface compatibility
- corporate governance still has not been adapted to the same execution-task pattern
