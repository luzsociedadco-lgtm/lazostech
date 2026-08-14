# NUDOS counsel review brief

Status: **READY FOR COUNSEL HANDOFF; NOT LEGAL ADVICE OR APPROVAL**.

This brief lets qualified Colombian counsel review the actual planned release
without treating draft product copy as final legal language. It does not name
an entity or data controller that the project has not formally confirmed.

## Release facts to review

- Product: NUDOS, an EVM application planned for Base Mainnet.
- Control: EIP-2535 Diamond upgrades and treasury emergency actions controlled
  by a three-owner, threshold-two Safe.
- Token: fixed supply of `1,000,000 NUDOS`; no owner, mint, pause, seizure or
  upgrade authority after deployment.
- Genesis allocation: `900,000 NUDOS` to the Safe and `100,000 NUDOS` to the
  Diamond reward treasury.
- Founder schedule: documented vesting/lockup policy must be reviewed together
  with the complete tokenomics and actual contractual allocation process.
- Application operator: a separate, minimally funded relayer/operator role
  that can be rotated or revoked by the Safe.
- Data systems: Supabase, Vercel, wallet addresses, application profiles,
  operational logs, email/alert services and public blockchain records.
- Current deployment status: no NUDOS Diamond or token contract has been
  deployed to Base Mainnet.

## Decisions counsel and the operating entity must close

1. Confirm the legal operating entity, Colombian tax identifier if applicable,
   public contact details and the entity that acts as personal-data controller.
2. Classify token issuance, founder vesting, rewards, marketplace use,
   transfers, treasury replenishment and any exchange/redemption functionality.
3. Confirm applicable consumer, tax/accounting, AML/CFT, reporting and
   virtual-asset-service obligations for the actual launch model.
4. Approve the privacy/data-treatment policy, terms, token risk disclosure,
   fee schedule, complaint channel and privacy-request channel.
5. Approve purposes, legal bases/authorizations, retention, subprocessors,
   international transfers/transmissions and blockchain immutability notices.
6. Confirm whether minors or sensitive data are in scope and define the
   resulting consent and safeguarding controls.
7. Approve a version/effective date and the versioned acceptance evidence the
   application must retain.

## Material for counsel

- `TOKENOMICS.md` and the token policy evidence.
- `docs/legal/LEGAL_REVIEW_CHECKLIST.md`.
- Draft routes `/legal`, `/legal/terminos`, `/legal/privacidad` and
  `/legal/riesgos-token`, all currently marked non-effective/no-index.
- `docs/policies/emergency-controls.md` and
  `docs/runbooks/incident-response.md`.
- `docs/audits/2026-08-12-external-audit-handoff.md`.
- Supabase authorization/restore evidence and the inventory of product data
  flows supplied privately to counsel.

## Required written outcome

The legal gate can be updated only after counsel identifies the reviewed
entity/product/version, records conditions or required changes, and the
operating entity publishes the approved notices. Draft review, an exploratory
call or an unsigned checklist does not close
`legal.tokenAndPrivacyReviewApproved` or
`legal.termsAndPrivacyPublished`.
