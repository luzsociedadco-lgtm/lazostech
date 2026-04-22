# Requires Audit For Pilot Workflow

This note tracks the `require(...)` checks that most directly affect the
user-facing workflow. The goal is to keep security-critical validation while
relaxing role bottlenecks that block pilot execution.

## Legend

- `KEEP`: required for integrity, anti-fraud, or storage safety.
- `RELAX`: broadened to include `owner` or `system admin` during pilot.
- `REPLACE`: swapped for a more accurate validation.
- `DEFER`: should be revisited when real auth / off-chain student sync lands.

## Summary Table

| Module | Function | Require / Gate | Impact on Flow | Recommendation |
| --- | --- | --- | --- | --- |
| `ProfileFacet` | `registerProfile` | `universityId != 0` | Blocks generic `0000` onboarding | `REPLACE` with supported-university whitelist |
| `ProfileFacet` | `registerProfile` | `university.id != 0` | Breaks valid `0000` sentinel use | `REPLACE` with name-based existence check |
| `ProfileFacet` | `registerProfile` | `metadataURI` required | Stops empty shell profiles | `KEEP`, but `DEFER` if auth creates draft profiles first |
| `UniversityFacet` | staff management | owner/staff mixed permissions | Staff could manage structural data | `RELAX` to owner/system admin only |
| `UniversityFacet` | `createUniversity` | owner only | Correct for institutional catalog | `KEEP` |
| `CampusFacet` | create/update staff ops | university staff only | Blocks owner/admin operational cleanup | `RELAX` to owner/system admin |
| `ProgramFacet` | create/update/assign | university staff only | Overloads staff with admin duties | `RELAX` to owner/system admin |
| `MachineFacet` | register/link/status | owner only | Slows pilot setup and cleanup | `RELAX` to owner/system admin |
| `UniversityGovernanceFacet` | member-only actions | strict assembly membership | Pilot users/admins get blocked too early | `RELAX` with governance-actor bypass |
| `UniversityGovernanceFacet` | admin-only actions | owner only | Blocks system admin operations | `RELAX` to owner/system admin |
| `CorporateGovernanceFacet` | chair/board/verifier roles | strict role-only progression | Hard to run end-to-end pilot | `RELAX` with owner/system admin bypass |
| `RecycleFacet` | oracle / cooldown / limits | anti-fraud checks | Restrictive but security-critical | `KEEP` |
| `TicketsFacet` | staff-only mint/use/grant | requires institutional operator | Consistent with cafeteria flow | `KEEP` for now |
| `MarketplaceFacet` | balance / ownership / one tx per block | protects balances and sales | Necessary for economic safety | `KEEP` |

## Comments By Area

### 1. Onboarding / Profile

- We now allow only `0000` and `1000` as supported universities in pilot mode.
- `0000` can exist on-chain only if we stop using `id != 0` as the existence
  check. The code now uses the stored university name for existence.
- Real app behavior still needs off-chain auth and student sync. Smart
  contracts alone cannot infer whether a user belongs to the university DB.

### 2. Institutional Catalog

- Structural catalog changes should stay centralized.
- `University Staff` should not mutate universities, campuses, programs, or
  machines in pilot mode if their role is meant to live inside governance only.
- Existing on-chain garbage records are safer to ignore/filter than to hard
  delete blindly. Historical references may still point to them.

### 3. Governance Pilot

- Role bottlenecks were relaxed by letting `owner` and `system admin` act as
  pilot operators.
- State machine checks were left intact.
- Time windows were left intact for now and may still slow full pilot tests.

### 4. Security-Critical Checks We Should Not Strip

- Duplicate recycle detection
- Oracle-machine linkage
- Machine active status
- User and machine cooldowns
- Material caps per recycle action
- Insufficient balance checks
- Ownership checks in marketplace
- Non-zero address guards

## Next Pass

1. Add real auth + draft profile creation flow in the frontend/backend layer.
2. Introduce progressive feature unlocks in the UI based on:
   - profile completeness
   - university validation
   - wallet linked
3. Add read helpers that expose canonical universities/campuses/programs for the app.
4. Revisit governance time windows for pilot execution.
